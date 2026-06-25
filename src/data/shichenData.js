export const shichenList = [
  {
    name: '子时',
    startHour: 23,
    endHour: 1,
    meridian: '胆经',
    acupuncture: '阳陵泉（合穴）、丘墟（原穴）',
    acupunctureEffect: '疏肝利胆、缓解偏头痛、口苦胁痛',
    massage: '足临泣、风池',
    tip: '此时宜熟睡，尽量不操作，睡前22:30按揉最佳',
    icon: '🌙',
  },
  {
    name: '丑时',
    startHour: 1,
    endHour: 3,
    meridian: '肝经',
    acupuncture: '太冲（原穴）、曲泉（合穴）',
    acupunctureEffect: '疏肝理气、改善烦躁失眠、眼干',
    massage: '行间、期门',
    tip: '需深度睡眠养肝，仅失眠人群可轻柔点按',
    icon: '🌑',
  },
  {
    name: '寅时',
    startHour: 3,
    endHour: 5,
    meridian: '肺经',
    acupuncture: '太渊（原穴）、尺泽（合穴）',
    acupunctureEffect: '止咳平喘、补气、改善晨起咳喘',
    massage: '鱼际、列缺',
    tip: '人体深度修复时段，不建议起身操作',
    icon: '🐦',
  },
  {
    name: '卯时',
    startHour: 5,
    endHour: 7,
    meridian: '大肠经',
    acupuncture: '合谷（原穴）、曲池（合穴）',
    acupunctureEffect: '通便排毒、清热解表、改善便秘',
    massage: '迎香、手三里',
    tip: '晨起排便前按揉5分钟，促肠道蠕动',
    icon: '🌅',
  },
  {
    name: '辰时',
    startHour: 7,
    endHour: 9,
    meridian: '胃经',
    acupuncture: '足三里（合穴）、冲阳（原穴）',
    acupunctureEffect: '健脾养胃、增强消化、补气血',
    massage: '内庭、丰隆',
    tip: '早餐后操作，缓解胃胀、食欲不振',
    icon: '🌤️',
  },
  {
    name: '巳时',
    startHour: 9,
    endHour: 11,
    meridian: '脾经',
    acupuncture: '太白（原穴）、阴陵泉（合穴）',
    acupunctureEffect: '祛湿健脾、改善乏力水肿、腹泻',
    massage: '公孙、三阴交',
    tip: '适合久坐人群，健脾祛湿、提神',
    icon: '☀️',
  },
  {
    name: '午时',
    startHour: 11,
    endHour: 13,
    meridian: '心经',
    acupuncture: '神门（原穴）、少海（合穴）',
    acupunctureEffect: '清心安神、缓解心慌、焦虑',
    massage: '少府、劳宫',
    tip: '午睡前轻按，搭配15分钟小憩护心',
    icon: '🌞',
  },
  {
    name: '未时',
    startHour: 13,
    endHour: 15,
    meridian: '小肠经',
    acupuncture: '腕骨（原穴）、小海（合穴）',
    acupunctureEffect: '分清泌浊、改善肩颈酸痛、上火耳鸣',
    massage: '后溪、听宫',
    tip: '饭后1小时操作，助消化、缓解久坐肩痛',
    icon: '⛅',
  },
  {
    name: '申时',
    startHour: 15,
    endHour: 17,
    meridian: '膀胱经',
    acupuncture: '京骨（原穴）、委中（合穴）',
    acupunctureEffect: '全身排毒、缓解腰背酸痛、祛寒湿',
    massage: '昆仑、天柱',
    tip: '适合拍打后背膀胱经，祛湿排毒',
    icon: '🌇',
  },
  {
    name: '酉时',
    startHour: 17,
    endHour: 19,
    meridian: '肾经',
    acupuncture: '太溪（原穴）、阴谷（合穴）',
    acupunctureEffect: '补肾固本、改善腰膝酸软、乏力',
    massage: '涌泉、复溜',
    tip: '傍晚调理，养肾精、缓解全天疲劳',
    icon: '🌆',
  },
  {
    name: '戌时',
    startHour: 19,
    endHour: 21,
    meridian: '心包经',
    acupuncture: '大陵（原穴）、曲泽（合穴）',
    acupunctureEffect: '疏肝解郁、缓解胸闷、烦躁失眠',
    massage: '膻中、内关',
    tip: '晚饭后按揉，舒缓情绪、化解压力',
    icon: '🌃',
  },
  {
    name: '亥时',
    startHour: 21,
    endHour: 23,
    meridian: '三焦经',
    acupuncture: '阳池（原穴）、天井（合穴）',
    acupunctureEffect: '通调全身气血、改善代谢、手脚冰凉',
    massage: '外关、支沟',
    tip: '睡前1小时操作，疏通三焦，助眠',
    icon: '🌌',
  },
];

export const getCurrentShichen = (date = new Date()) => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeText = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  // 特殊处理 23 点之后（子时，跨日）
  for (const s of shichenList) {
    if (s.startHour === 23) {
      if (hour >= 23 || hour < s.endHour) {
        return { shichen: s, timeText };
      }
    } else {
      if (hour >= s.startHour && hour < s.endHour) {
        return { shichen: s, timeText };
      }
    }
  }
  return { shichen: shichenList[0], timeText };
};
