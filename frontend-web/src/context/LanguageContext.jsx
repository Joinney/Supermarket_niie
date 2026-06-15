import React, { createContext, useState, useContext, useEffect } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children, initialLanguage }) => {
  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  // Minimal translation dictionary. Add keys as needed.
  const translations = {
    vi: {
      search_placeholder: 'Tìm sản phẩm trên siêu thị Demi Mart...',
      login: 'Đăng nhập',
      signup: 'Đăng ký',
      cart: 'Giỏ hàng',
      online_247: 'Online 24/7',
      hero_title_part1: 'Siêu thị trực tuyến',
      hero_title_part2: 'hàng đầu',
      hero_title_em: 'Á Châu',
      favorites_title: 'Sản phẩm yêu thích',
      see_more: 'XEM THÊM',
      search: { no_results: 'Rất tiếc, hiện không có sản phẩm phù hợp với tìm kiếm của bạn.' },
      nav_global: 'Toàn cầu+',

      nav_new: 'Mới về',
      nav_bestseller: 'Bán chạy',
      nav_deals: 'Ưu đãi',
      sidebar: {
        main: { search: 'Tìm kiếm', promotion: 'Khuyến mãi', bestseller: 'Bán chạy' },
        product_catalog: 'Danh mục sản phẩm',
        current_store: 'Cửa hàng hiện tại',
        hot: 'HOT',
        footerLinks: ['Tải ứng dụng', 'Quảng cáo', 'Công ty', 'Mua sỉ', 'Hỗ trợ', 'Bảo mật', 'Điều khoản'],
        categories: {
          'do-an-lien': 'Đồ ăn liền',
          'banh-mi': 'Bánh mì',
          'do-an-vat': 'Đồ ăn vặt',
          'do-uong': 'Đồ uống',
          'sua-va-trung': 'Sữa & Trứng',
          'do-chay': 'Đồ chay',
          'gia-vi': 'Gia vị',
          'do-dong-hop': 'Đồ đóng hộp',
          'gao-va-do-kho': 'Gạo & Đồ khô',
          'cham-soc-ca-nhan': 'Chăm sóc cá nhân',
          'do-gia-dung': 'Đồ gia dụng',
          'ruou-bia': 'Rượu bia',
          'so-che-san': 'Sơ chế sẵn',
          'banh-tuoi': 'Bánh tươi',
          'suc-khoe': 'Sức khỏe'
        }
      }
    },
    en: {
      search_placeholder: 'Search products on Demi Mart...',
      login: 'Sign in',
      signup: 'Sign up',
      cart: 'Cart',
      online_247: 'Online 24/7',
      hero_title_part1: 'Online supermarket',
      hero_title_part2: 'leading in',
      hero_title_em: 'Asia',
      favorites_title: 'Favorite products',
      see_more: 'SEE MORE',
      search: { no_results: 'Currently, no products matching your search criteria are available.' },
      nav_global: 'Global+',

      nav_new: 'New Arrivals',
      nav_bestseller: 'Bestsellers',
      nav_deals: 'Deals',
      sidebar: {
        main: { search: 'Search', promotion: 'Promotion', bestseller: 'Bestselling' },
        product_catalog: 'Product Catalog',
        current_store: 'Current store',
        hot: 'HOT',
        footerLinks: ['Download App', 'Advertising', 'Company', 'Wholesale', 'Support', 'Privacy', 'Terms'],
        categories: {
          'do-an-lien': 'Instant food',
          'banh-mi': 'Bread',
          'do-an-vat': 'Snacks',
          'do-uong': 'Beverage',
          'sua-va-trung': 'Milk & Eggs',
          'do-chay': 'Vegetarian food',
          'gia-vi': 'Spices',
          'do-dong-hop': 'Canned goods',
          'gao-va-do-kho': 'Rice & Dry goods',
          'cham-soc-ca-nhan': 'Personal care',
          'do-gia-dung': 'Household',
          'ruou-bia': 'Alcohol',
          'so-che-san': 'Prepared',
          'banh-tuoi': 'Fresh bakery',
          'suc-khoe': 'Health'
        }
      }
    },
    zh: {
      search_placeholder: '在Demi Mart搜索商品...',
      login: '登录',
      signup: '注册',
      cart: '购物车',
      online_247: '24/7 在线',
      hero_title_part1: '在线超市',
      hero_title_part2: '领先于',
      hero_title_em: '亚洲',
      favorites_title: '受欢迎的商品',
      see_more: '查看更多',
      search: { no_results: '抱歉，当前没有符合您搜索条件的商品。' },
      nav_global: '全球+',

      nav_new: '新品',
      nav_bestseller: '畅销',
      nav_deals: '优惠',
      sidebar: {
        main: { search: '搜索', promotion: '促销', bestseller: '畅销' },
        product_catalog: '产品目录',
        current_store: '当前商店',
        hot: 'HOT',
        footerLinks: ['下载应用', '广告', '公司', '批发', '支持', '隐私', '条款'],
        categories: {
          'do-an-lien': '方便食品',
          'banh-mi': '面包',
          'do-an-vat': '零食',
          'do-uong': '饮料',
          'sua-va-trung': '牛奶与鸡蛋',
          'do-chay': '素食',
          'gia-vi': '调味品',
          'do-dong-hop': '罐装食品',
          'gao-va-do-kho': '大米与干货',
          'cham-soc-ca-nhan': '个人护理',
          'do-gia-dung': '家居用品',
          'ruou-bia': '酒类',
          'so-che-san': '预制食品',
          'banh-tuoi': '新鲜面包',
          'suc-khoe': '健康'
        }
      }
    }
  };

  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = initialLanguage ?? localStorage.getItem('demi_mart_lang');
    return languages.find(l => l.code === saved) || languages[0];
  });

  useEffect(() => {
    localStorage.setItem('demi_mart_lang', currentLanguage.code);
  }, [currentLanguage]);

  const changeLanguage = (langCode) => {
    const lang = languages.find(l => l.code === langCode);
    if (lang) {
      setCurrentLanguage(lang);
      // If page-level Google Translate is available, sync it immediately.
      try {
        const toGoogle = (code) => code === 'zh' ? 'zh-CN' : code;
        if (window && typeof window.changeLanguageAuto === 'function') {
          // call after a short delay to allow localStorage update
          setTimeout(() => window.changeLanguageAuto(toGoogle(langCode)), 100);
        }
      } catch (e) {
        // ignore in non-browser or if function missing
      }
      // Do not force a full reload here. App-level strings use `t()` and
      // React will re-render components when `currentLanguage` changes.
      // If you have API calls that return localized data, include
      // `currentLanguage.code` as a dependency in those hooks so they refetch.
    }
  };

  const t = (key, fallback) => {
    if (!key) return fallback ?? key;
    const dict = translations[currentLanguage.code] || {};
    // support nested keys like 'sidebar.main.search' and array indexes
    const parts = String(key).split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur == null) break;
      // numeric index access
      if (/^\d+$/.test(p)) {
        cur = cur[Number(p)];
      } else {
        cur = cur[p];
      }
    }
    return cur ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, languages, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
