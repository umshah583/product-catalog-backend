import { Injectable, NotFoundException } from '@nestjs/common';
import { SettingsRepository } from './settings.repository.js';

@Injectable()
export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}

  async findByTenant(tenantId: string) {
    const settings = await this.settingsRepository.findByTenant(tenantId);
    if (!settings) {
      throw new NotFoundException('Settings not found for tenant');
    }
    
    // Ensure currencySymbol is set based on currency
    if (settings.currency) {
      const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        INR: '₹',
        AED: 'AED',
      };
      // Always update currencySymbol to match current currency
      settings.currencySymbol = symbols[settings.currency] || settings.currency;
    }
    
    return settings;
  }

  async upsert(tenantId: string, data: any) {
    // Set currencySymbol based on currency
    if (data.currency) {
      const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        INR: '₹',
        AED: 'AED',
      };
      data.currencySymbol = symbols[data.currency] || data.currency;
    }
    
    return this.settingsRepository.upsert(tenantId, data);
  }

  async update(tenantId: string, data: any) {
    await this.findByTenant(tenantId);
    
    // Set currencySymbol based on currency if currency is being updated
    if (data.currency) {
      const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        INR: '₹',
        AED: 'AED',
      };
      data.currencySymbol = symbols[data.currency] || data.currency;
    }
    
    return this.settingsRepository.update(tenantId, data);
  }
}
