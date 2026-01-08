import type { Schema, Attribute } from '@strapi/strapi';

export interface ProductFeature extends Schema.Component {
  collectionName: 'components_product_features';
  info: {
    displayName: 'Product Feature';
    description: 'Product features and benefits';
  };
  attributes: {
    label: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    icon: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
  };
}

export interface ProductPricing extends Schema.Component {
  collectionName: 'components_product_pricings';
  info: {
    displayName: 'Product Pricing';
    description: 'Pricing information for different weight options';
  };
  attributes: {
    weight: Attribute.Enumeration<['7g', '14g', '28g']> & Attribute.Required;
    amount: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 0;
      }>;
    currency: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 3;
      }> &
      Attribute.DefaultTo<'USD'>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'product.feature': ProductFeature;
      'product.pricing': ProductPricing;
    }
  }
}
