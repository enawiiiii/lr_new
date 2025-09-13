export interface Employee {
  name: string;
  id: string;
}

export interface Context {
  id: 'boutique' | 'online';
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

export const EMPLOYEES: Employee[] = [
  { id: 'abdulrahman', name: 'عبدالرحمن' },
  { id: 'heba', name: 'هبة' },
  { id: 'hadeel', name: 'هديل' }
];

export const CONTEXTS: Context[] = [
  {
    id: 'boutique',
    name: 'البوتيك',
    description: 'المبيعات المباشرة في المتجر',
    icon: 'fas fa-store',
    color: 'primary',
    features: [
      'إدارة المخزون المحلي',
      'فواتير فورية',
      'خصم مباشر من المخزون',
      'تقارير مبيعات البوتيك'
    ]
  },
  {
    id: 'online',
    name: 'أونلاين',
    description: 'الطلبات والمبيعات الإلكترونية',
    icon: 'fas fa-globe',
    color: 'secondary',
    features: [
      'إدارة الطلبات الإلكترونية',
      'تتبع حالة الطلبات',
      'نظام المرتجعات',
      'تقارير المبيعات الإلكترونية'
    ]
  }
];

export const ORDER_STATUSES = {
  pending: 'قيد التوصيل',
  delivered: 'وصل',
  cancelled: 'تم إلغاؤه',
  returned: 'مرتجع'
};

export const EMIRATES = [
  'أبوظبي',
  'دبي',
  'الشارقة',
  'عجمان',
  'أم القيوين',
  'رأس الخيمة',
  'الفجيرة'
];
