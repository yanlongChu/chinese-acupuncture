// 问答历史数据
export const qaData = [
  {
    id: 1,
    question: '头痛伴有眩晕，应该艾灸哪些穴位？',
    symptoms: '头痛、眩晕、睡眠不佳',
    bodyPart: '头部',
    category: '头部疾病',
    status: 'answered',
    answer: '建议艾灸百会、太阳、风池等穴位。百会穴位于头顶正中，可以升阳举陷、醒脑开窍；太阳穴在额部两侧，能够疏风止痛；风池穴在颈后发际两侧凹陷处，具有祛风解表的功效。建议每次灸15-20分钟，每日1次。',
    recommendedPoints: ['百会', '太阳', '风池', '神庭'],
    createTime: '2026-06-14 10:30:00',
    updateTime: '2026-06-14 10:35:00'
  },
  {
    id: 2,
    question: '失眠多梦，如何通过针灸改善？',
    symptoms: '失眠、多梦、心烦',
    bodyPart: '全身',
    category: '神经系统',
    status: 'answered',
    answer: '针对失眠多梦，建议针刺神门、三阴交、内关等穴位。神门穴是心经原穴，能够宁心安神；三阴交是肝脾肾三经交会穴，可调理气血；内关穴位于前臂，有理气安神之效。可配合艾灸涌泉穴。',
    recommendedPoints: ['神门', '三阴交', '内关', '涌泉'],
    createTime: '2026-06-13 15:20:00',
    updateTime: '2026-06-13 15:28:00'
  },
  {
    id: 3,
    question: '腰痛持续三天，针灸有效吗？',
    symptoms: '腰痛、活动受限',
    bodyPart: '腰部',
    category: '骨骼肌肉',
    status: 'answered',
    answer: '腰痛可以通过针灸得到很好的缓解。主要穴位包括肾俞、腰阳关、委中、承山等。肾俞穴在腰部第二腰椎棘突下旁开1.5寸，主治腰痛；腰阳关在腰部正中；委中、承山位于腿部后侧，是治疗腰腿痛的要穴。',
    recommendedPoints: ['肾俞', '腰阳关', '委中', '承山'],
    createTime: '2026-06-13 09:15:00',
    updateTime: '2026-06-13 09:20:00'
  },
  {
    id: 4,
    question: '胃胀气、消化不良用什么穴位？',
    symptoms: '胃胀、消化不良、食欲不振',
    bodyPart: '腹部',
    category: '消化系统',
    status: 'answered',
    answer: '消化不良建议取穴中脘、足三里、天枢、内关。中脘是胃之募穴，位于上腹部正中，主治各种胃病；足三里是强壮穴，能健脾和胃；天枢调理肠胃气机；内关和胃降逆。可采用温针灸或艾灸方法。',
    recommendedPoints: ['中脘', '足三里', '天枢', '内关'],
    createTime: '2026-06-12 14:30:00',
    updateTime: '2026-06-12 14:38:00'
  },
  {
    id: 5,
    question: '肩颈酸痛，长期伏案工作导致',
    symptoms: '肩颈酸痛、僵硬',
    bodyPart: '肩颈部',
    category: '骨骼肌肉',
    status: 'pending',
    answer: '',
    recommendedPoints: [],
    createTime: '2026-06-14 11:50:00',
    updateTime: '2026-06-14 11:50:00'
  }
];

// 知识库数据
export const knowledgeData = [
  {
    id: 1,
    title: '百会穴的定位与主治',
    category: '穴位知识',
    tags: ['百会', '头部', '升阳'],
    content: '【定位】位于头顶正中线与两耳尖连线的交点处，即头顶正中央。\n\n【主治】头痛、眩晕、中风、失眠、健忘、脱肛、子宫脱垂等。\n\n【操作方法】针刺：沿皮刺0.5-0.8寸。艾灸：温和灸5-15分钟。',
    author: '系统管理员',
    views: 1523,
    createTime: '2026-05-20 10:00:00',
    updateTime: '2026-06-10 15:30:00'
  },
  {
    id: 2,
    title: '足三里穴位详解及临床应用',
    category: '穴位知识',
    tags: ['足三里', '腿部', '强壮穴'],
    content: '【定位】在小腿外侧，犊鼻下3寸，距胫骨前缘一横指（中指）。\n\n【主治】胃痛、呕吐、腹胀、腹泻、便秘、下肢痿痹、虚劳诸证。为强壮保健要穴。\n\n【操作方法】针刺：直刺1-2寸。艾灸：温和灸10-20分钟。\n\n【临床应用】可用于消化系统疾病、免疫力低下、疲劳综合征等。',
    author: '李医师',
    views: 2156,
    createTime: '2026-05-18 09:30:00',
    updateTime: '2026-06-08 11:20:00'
  },
  {
    id: 3,
    title: '针灸治疗失眠的配穴方案',
    category: '治疗方案',
    tags: ['失眠', '配穴', '治疗'],
    content: '【主穴】神门、三阴交、内关、安眠\n\n【配穴】\n- 心脾两虚：加心俞、脾俞\n- 心肾不交：加太溪、心俞\n- 肝郁化火：加太冲、行间\n\n【操作】每次取3-5穴，针刺得气后留针30分钟，每日或隔日1次，10次为一疗程。\n\n【注意事项】睡前2小时治疗效果最佳。',
    author: '王主任',
    views: 1834,
    createTime: '2026-05-15 14:20:00',
    updateTime: '2026-06-05 16:45:00'
  },
  {
    id: 4,
    title: '腰痛的辨证取穴要点',
    category: '治疗方案',
    tags: ['腰痛', '辨证', '取穴'],
    content: '【寒湿腰痛】\n主穴：肾俞、腰阳关、委中\n配穴：加灸命门、腰眼\n\n【湿热腰痛】\n主穴：腰阳关、阴陵泉、委中\n配穴：加次髎、三阴交\n\n【肾虚腰痛】\n主穴：肾俞、太溪、腰阳关\n配穴：志室、命门（多用艾灸）\n\n【瘀血腰痛】\n主穴：阿是穴、膈俞、血海\n配穴：委中点刺放血',
    author: '张教授',
    views: 1678,
    createTime: '2026-05-10 11:00:00',
    updateTime: '2026-06-01 09:15:00'
  },
  {
    id: 5,
    title: '常见急性病症的针灸急救',
    category: '急救知识',
    tags: ['急救', '急性病', '针灸'],
    content: '【中暑】\n取穴：人中、十宣、委中\n方法：人中重刺激，十宣点刺放血\n\n【晕厥】\n取穴：人中、内关、涌泉\n方法：强刺激，不留针\n\n【急性胃痛】\n取穴：中脘、足三里、内关\n方法：快速进针，强刺激\n\n【落枕】\n取穴：悬钟、后溪、阿是穴\n方法：配合颈部活动',
    author: '刘医师',
    views: 2341,
    createTime: '2026-05-05 10:30:00',
    updateTime: '2026-05-28 14:20:00'
  },
  {
    id: 6,
    title: '三阴交穴的多系统应用',
    category: '穴位知识',
    tags: ['三阴交', '妇科', '多功能'],
    content: '【定位】在小腿内侧，内踝尖上3寸，胫骨内侧缘后方。\n\n【主治】\n1. 妇科疾病：月经不调、痛经、崩漏、带下、不孕\n2. 消化系统：腹胀、腹泻、食欲不振\n3. 泌尿系统：遗尿、尿频\n4. 神经系统：失眠、神经衰弱\n\n【特点】肝脾肾三经交会穴，调理气血效果显著。\n\n【禁忌】孕妇慎用。',
    author: '陈医师',
    views: 1956,
    createTime: '2026-04-28 15:40:00',
    updateTime: '2026-05-25 10:30:00'
  }
];

// 穴位数据
export const acupointData = [
  {
    id: 1,
    name: '百会',
    englishName: 'Baihui',
    code: 'GV20',
    meridian: '督脉',
    location: '头顶正中线与两耳尖连线的交点',
    position: { x: 0, y: 1.5, z: 0 },
    indications: ['头痛', '眩晕', '失眠', '中风', '脱肛'],
    method: '针刺：沿皮刺0.5-0.8寸；艾灸：5-15分钟',
    precautions: '不宜深刺'
  },
  {
    id: 2,
    name: '足三里',
    englishName: 'Zusanli',
    code: 'ST36',
    meridian: '足阳明胃经',
    location: '犊鼻下3寸，距胫骨前缘一横指',
    position: { x: 0.15, y: -0.8, z: 0.1 },
    indications: ['胃痛', '呕吐', '腹胀', '腹泻', '下肢痿痹'],
    method: '针刺：直刺1-2寸；艾灸：10-20分钟',
    precautions: '强壮保健要穴'
  },
  {
    id: 3,
    name: '内关',
    englishName: 'Neiguan',
    code: 'PC6',
    meridian: '手厥阴心包经',
    location: '腕横纹上2寸，掌长肌腱与桡侧腕屈肌腱之间',
    position: { x: -0.3, y: 0.5, z: 0.2 },
    indications: ['心痛', '心悸', '胃痛', '呕吐', '失眠'],
    method: '针刺：直刺0.5-1寸；艾灸：5-10分钟',
    precautions: '常用配穴穴位'
  },
  {
    id: 4,
    name: '神门',
    englishName: 'Shenmen',
    code: 'HT7',
    meridian: '手少阴心经',
    location: '腕掌侧横纹尺侧端，尺侧腕屈肌腱桡侧凹陷处',
    position: { x: -0.3, y: 0.45, z: 0.15 },
    indications: ['失眠', '健忘', '心悸', '癫狂', '痴呆'],
    method: '针刺：直刺0.3-0.5寸；艾灸：3-5分钟',
    precautions: '宁心安神要穴'
  },
  {
    id: 5,
    name: '三阴交',
    englishName: 'Sanyinjiao',
    code: 'SP6',
    meridian: '足太阴脾经',
    location: '内踝尖上3寸，胫骨内侧缘后方',
    position: { x: -0.15, y: -0.9, z: 0 },
    indications: ['月经不调', '痛经', '腹胀', '腹泻', '失眠'],
    method: '针刺：直刺1-1.5寸；艾灸：10-20分钟',
    precautions: '孕妇禁用'
  },
  {
    id: 6,
    name: '风池',
    englishName: 'Fengchi',
    code: 'GB20',
    meridian: '足少阳胆经',
    location: '颈后发际两侧凹陷处',
    position: { x: 0.12, y: 1.2, z: -0.15 },
    indications: ['头痛', '眩晕', '颈项强痛', '感冒', '中风'],
    method: '针刺：向鼻尖方向斜刺0.5-1寸',
    precautions: '注意针刺方向和深度'
  }
];

// 穴位分类
export const acupointCategories = [
  { value: '头面部', label: '头面部' },
  { value: '颈肩部', label: '颈肩部' },
  { value: '胸腹部', label: '胸腹部' },
  { value: '腰背部', label: '腰背部' },
  { value: '上肢', label: '上肢' },
  { value: '下肢', label: '下肢' }
];

// 问题分类
export const questionCategories = [
  { value: '头部疾病', label: '头部疾病' },
  { value: '神经系统', label: '神经系统' },
  { value: '消化系统', label: '消化系统' },
  { value: '骨骼肌肉', label: '骨骼肌肉' },
  { value: '呼吸系统', label: '呼吸系统' },
  { value: '妇科', label: '妇科' },
  { value: '其他', label: '其他' }
];

// 知识分类
export const knowledgeCategories = [
  { value: '穴位知识', label: '穴位知识' },
  { value: '治疗方案', label: '治疗方案' },
  { value: '急救知识', label: '急救知识' },
  { value: '理论基础', label: '理论基础' },
  { value: '临床经验', label: '临床经验' }
];

// 状态选项
export const statusOptions = [
  { value: 'pending', label: '待回答', color: 'orange' },
  { value: 'answered', label: '已回答', color: 'green' },
  { value: 'closed', label: '已关闭', color: 'default' }
];
