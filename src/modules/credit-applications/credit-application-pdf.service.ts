import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

interface FieldDef {
  page: number;
  type: 'text' | 'checkbox' | 'image' | 'table';
  x?: number;
  y?: number;
  size?: number;
  w?: number;
  h?: number;
  maxWidth?: number;
  mirror?: { x: number; y: number };
  rowY?: number[];
  cols?: Record<string, { x: number }>;
}

interface FieldMap {
  template: string;
  pageSize: { width: number; height: number };
  footer?: {
    initials?: { x: number; y: number; size: number };
    stamp?: { x: number; y: number; w: number; h: number };
  };
  fields: Record<string, FieldDef>;
}

/**
 * Renders a completed credit application by overlaying values onto the
 * untouched master PDF template. Field positions come from
 * credit-application-v1.map.json — coordinates are measured from the
 * TOP-LEFT corner of each page; pdf-lib draws bottom-left, so y is
 * converted at draw time. The template PDF itself is never modified.
 */
@Injectable()
export class CreditApplicationPdfService {
  private map: FieldMap | null = null;

  private getMap(): FieldMap {
    if (!this.map) {
      const mapPath = path.join(
        process.cwd(),
        'assets',
        'templates',
        'credit-application-v1.map.json',
      );
      this.map = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    }
    return this.map!;
  }

  private ty(pageHeight: number, y: number): number {
    return pageHeight - y;
  }

  async generate(application: {
    formData: any;
    customerName: string;
    customerTrn?: string | null;
    signatureData?: string | null;
    stampData?: string | null;
    initials?: string | null;
    appNumber: string;
  }): Promise<Uint8Array> {
    const map = this.getMap();
    const templatePath = path.join(
      process.cwd(),
      'assets',
      'templates',
      map.template,
    );
    if (!fs.existsSync(templatePath)) {
      throw new InternalServerErrorException(
        'Credit application PDF template is not installed',
      );
    }

    const doc = await PDFDocument.load(fs.readFileSync(templatePath));
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();
    const data = (application.formData ?? {}) as Record<string, any>;

    const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, '');

    /**
     * Fit text to a width by shrinking the font (down to `min`), then
     * truncating with an ellipsis if it still doesn't fit.
     */
    const fitText = (
      v: string,
      maxWidth: number | undefined,
      size: number,
      min = 5,
    ): { v: string; size: number } => {
      if (!maxWidth) return { v, size };
      const clean = ascii(v) || v;
      let s = size;
      let w = font.widthOfTextAtSize(clean, s);
      while (w > maxWidth && s > min) {
        s -= 0.5;
        w = font.widthOfTextAtSize(clean, s);
      }
      if (w <= maxWidth) return { v: clean, size: s };
      // truncate
      let t = clean;
      while (t.length > 3 && font.widthOfTextAtSize(t + '…', min) > maxWidth) {
        t = t.slice(0, -1);
      }
      return { v: t + '…', size: min };
    };

    const drawText = (
      p: number,
      x: number,
      y: number,
      text: string,
      size = 10,
      maxWidth?: number,
    ) => {
      const page = pages[p];
      if (!page || !text) return;
      const { v, size: s } = fitText(String(text), maxWidth, size);
      try {
        page.drawText(v, {
          x,
          y: this.ty(page.getHeight(), y),
          size: s,
          font,
          color: rgb(0, 0, 0),
        });
      } catch {}
    };

    /** Right-aligned text: `x` is the RIGHT edge the text must end at. */
    const drawTextRight = (
      p: number,
      xEnd: number,
      y: number,
      text: string,
      size = 10,
      maxWidth?: number,
    ) => {
      const page = pages[p];
      if (!page || !text) return;
      const { v, size: s } = fitText(String(text), maxWidth, size);
      try {
        page.drawText(v, {
          x: xEnd - font.widthOfTextAtSize(v, s),
          y: this.ty(page.getHeight(), y),
          size: s,
          font,
          color: rgb(0, 0, 0),
        });
      } catch {}
    };

    const drawCheck = (p: number, x: number, y: number) => {
      const page = pages[p];
      if (!page) return;
      page.drawRectangle({
        x: x - 0.5,
        y: this.ty(page.getHeight(), y) - 7.5,
        width: 8.5,
        height: 8.5,
        color: rgb(0, 0, 0),
      });
    };

    const drawImageFit = (p: number, img: any, x: number, y: number, w: number, h: number) => {
      const page = pages[p];
      if (!page) return;
      const scale = Math.min(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      page.drawImage(img, {
        x,
        y: this.ty(page.getHeight(), y) - dh,
        width: dw,
        height: dh,
      });
    };

    const embedImage = async (dataUrl: string | null | undefined) => {
      if (!dataUrl || !dataUrl.startsWith('data:')) return null;
      try {
        const buf = Buffer.from(
          dataUrl.replace(/^data:image\/\w+;base64,/, ''),
          'base64',
        );
        return dataUrl.includes('image/png')
          ? await doc.embedPng(buf)
          : await doc.embedJpg(buf);
      } catch {
        return null;
      }
    };

    const sigImg = await embedImage(application.signatureData);
    const stampImg = await embedImage(application.stampData);
    const f = map.fields;

    /**
     * Write a mapped text field. The English side is left-aligned at `x`;
     * the Arabic mirror side is right-aligned — `mirror.x` is the right
     * edge the value must end at (just before the Arabic label), so long
     * values extend left into the dotted space instead of colliding with
     * the label.
     */
    const text = (key: string, value: string, bold = false) => {
      const def = f[key];
      const v = String(value ?? '');
      if (!def || !v) return;
      const page = pages[def.page];
      if (!page) return;
      const size = def.size ?? 10;
      const yEn = this.ty(page.getHeight(), def.y!);
      try {
        const { v: fv, size: fs } = fitText(v, def.maxWidth, size);
        page.drawText(fv, { x: def.x!, y: yEn, size: fs, font: bold ? boldFont : font, color: rgb(0, 0, 0) });
      } catch {}
      if (def.mirror) {
        const { v: fv, size: fs } = fitText(v, def.maxWidth, size);
        try {
          page.drawText(fv, {
            x: def.mirror.x - (bold ? boldFont : font).widthOfTextAtSize(fv, fs),
            y: this.ty(page.getHeight(), def.mirror.y),
            size: fs,
            font: bold ? boldFont : font,
            color: rgb(0, 0, 0),
          });
        } catch {}
      }
    };

    const check = (key: string) => {
      const def = f[key];
      if (!def) return;
      drawCheck(def.page, def.x!, def.y!);
      if (def.mirror) drawCheck(def.page, def.mirror.x, def.mirror.y);
    };

    const table = (key: string, rows: any[]) => {
      const def = f[key];
      if (!def || !def.rowY || !def.cols) return;
      const colEntries = Object.entries(def.cols!);
      rows.slice(0, def.rowY.length).forEach((row: any, i: number) => {
        for (const [col, pos] of colEntries) {
          const v = row?.[col];
          if (!v) continue;
          // column width = next column's x minus this x, minus padding
          const nextX = colEntries
            .map(([, p]) => p.x)
            .filter((x) => x > pos.x)
            .sort((a, b) => a - b)[0];
          const maxW = nextX ? nextX - pos.x - 5 : 576 - pos.x - 5;
          drawText(def.page, pos.x, def.rowY![i], String(v), def.size ?? 9, maxW);
        }
      });
    };

    // ---- Page 1: cover ----
    const appDate = data.appDate ? new Date(data.appDate) : new Date();
    text('p1.date.day', String(appDate.getDate()).padStart(2, '0'));
    text('p1.date.month', String(appDate.getMonth() + 1).padStart(2, '0'));
    text('p1.date.year', String(appDate.getFullYear()));
    // 'Customer Reference No.' is for office use — left blank.
    text('p1.commercialName', data.commercialName ?? application.customerName);
    text('p1.trn', data.trn ?? application.customerTrn ?? '');

    const checklist: Record<string, { received?: boolean; remarks?: string }> =
      data.documents ?? {};
    for (let i = 1; i <= 8; i++) {
      const info = checklist[String(i)];
      if (info?.received) check(`p1.check.${i}`);
      if (info?.remarks) text(`p1.remarks.${i}`, info.remarks);
    }

    text('p1.signerName', data.signerName ?? '', true);
    if (sigImg && f['p1.signature'])
      drawImageFit(0, sigImg, f['p1.signature'].x!, f['p1.signature'].y!, f['p1.signature'].w!, f['p1.signature'].h!);
    if (stampImg && f['p1.stamp'])
      drawImageFit(0, stampImg, f['p1.stamp'].x!, f['p1.stamp'].y!, f['p1.stamp'].w!, f['p1.stamp'].h!);

    // ---- Page 2: sale on credit ----
    text('p2.date', data.appDateText ?? appDate.toLocaleDateString('en-GB'));
    text('p2.companyName', data.companyName ?? data.commercialName ?? '', true);
    text('p2.licenseNo', data.licenseNo ?? '');
    text('p2.issueDate', data.issueDate ?? '');
    text('p2.expiryDate', data.expiryDate ?? '');

    const legalKey = String(data.legalType ?? '');
    const legalMap: Record<string, string> = {
      LLC: 'p2.legal.LLC',
      ONE_PERSON_LLC: 'p2.legal.ONE_PERSON',
      SOLE_ESTABLISHMENT: 'p2.legal.SOLE_EST',
      FZC: 'p2.legal.FZC',
      FZE: 'p2.legal.FZE',
      CIVIL_COMPANY: 'p2.legal.CIVIL',
      OTHER: 'p2.legal.OTHER',
    };
    if (legalMap[legalKey]) check(legalMap[legalKey]);
    if (legalKey === 'OTHER') text('p2.legalOtherText', data.legalOther ?? '');

    text('p2.emirate', data.emirate ?? '');
    text('p2.area', data.area ?? '');
    text('p2.street', data.street ?? '');
    text('p2.landmark', data.landmark ?? '');
    text('p2.building', data.building ?? '');
    text('p2.shopNo', data.shopNo ?? '');
    text('p2.telMobile', data.telMobile ?? '');
    text('p2.fax', data.fax ?? '');
    text('p2.email', data.email ?? '');
    text('p2.poBox', data.poBox ?? '');
    text('p2.makani', data.makani ?? '');

    // ---- Page 3: owners, banks, credit, VAT, references ----
    table('p3.owners', data.owners ?? []);
    table('p3.banks', data.banks ?? []);

    text('p3.creditAmount', data.creditAmount != null ? String(data.creditAmount) : '');
    const termsKey = String(data.paymentTerms ?? '');
    const termsMap: Record<string, string> = {
      '15': 'p3.terms.15',
      '30': 'p3.terms.30',
      OTHER: 'p3.terms.OTHER',
    };
    if (termsMap[termsKey]) check(termsMap[termsKey]);
    if (termsKey === 'OTHER') text('p3.termsOtherText', data.paymentTermsOther ?? '');

    text('p3.vatCompanyName', data.vatCompanyName ?? data.companyName ?? '');
    text('p3.vatTrn', data.vatTrn ?? data.trn ?? '');

    table('p3.references', data.references ?? []);

    // ---- Page 5: signatures ----
    if (stampImg && f['p5.sealImage'])
      drawImageFit(4, stampImg, f['p5.sealImage'].x!, f['p5.sealImage'].y!, f['p5.sealImage'].w!, f['p5.sealImage'].h!);
    text('p5.signerName', data.signerName ?? '');
    if (sigImg && f['p5.signature'])
      drawImageFit(4, sigImg, f['p5.signature'].x!, f['p5.signature'].y!, f['p5.signature'].w!, f['p5.signature'].h!);
    text('p5.signerDate', data.signerDate ?? appDate.toLocaleDateString('en-GB'));

    // ---- Footer initials + stamp on every page ----
    for (const page of pages) {
      const h = page.getHeight();
      if (application.initials) {
        page.drawText(application.initials, {
          x: map.footer!.initials!.x,
          y: this.ty(h, map.footer!.initials!.y),
          size: map.footer!.initials!.size,
          font,
          color: rgb(0, 0, 0),
        });
      }
      if (stampImg) {
        const s = map.footer!.stamp!;
        const scale = Math.min(s.w / stampImg.width, s.h / stampImg.height);
        page.drawImage(stampImg, {
          x: s.x,
          y: this.ty(h, s.y) - stampImg.height * scale,
          width: stampImg.width * scale,
          height: stampImg.height * scale,
        });
      }
    }

    return doc.save();
  }
}
