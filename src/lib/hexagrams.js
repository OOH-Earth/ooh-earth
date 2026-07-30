// OOH Earth Hex Engine — 64-state protocol data (canonical module)
// Ported verbatim from the design handoff; window global → ES export for the React stack.
// Lines are arrays of 6 bits, index 0 = bottom line (Ring 1), 1 = yang, 0 = yin.
export const OOHEX = (() => {
  const TRI = {
    '111': { pinyin: 'Qián', el: 'Heaven',   sym: '☰', layer: 'Identity',        verb: 'SIGN',     verbDesc: 'authenticate & authorize' },
    '000': { pinyin: 'Kūn',  el: 'Earth',    sym: '☷', layer: 'DAO / Governance',verb: 'BUILD',    verbDesc: 'propose, vote, govern' },
    '100': { pinyin: 'Zhèn', el: 'Thunder',  sym: '☳', layer: 'Maps / Discovery',verb: 'MOVE',     verbDesc: 'navigate the city layer' },
    '010': { pinyin: 'Kǎn',  el: 'Water',    sym: '☵', layer: 'Events',          verb: 'CONNECT',  verbDesc: 'link peers & places' },
    '001': { pinyin: 'Gèn',  el: 'Mountain', sym: '☶', layer: 'Assets',          verb: 'VERIFY',   verbDesc: 'prove presence & provenance' },
    '011': { pinyin: 'Xùn',  el: 'Wind',     sym: '☴', layer: 'Communities',     verb: 'DISCOVER', verbDesc: 'surface nearby activity' },
    '101': { pinyin: 'Lí',   el: 'Fire',     sym: '☲', layer: 'Campaigns',       verb: 'CREATE',   verbDesc: 'publish to the commons' },
    '110': { pinyin: 'Duì',  el: 'Lake',     sym: '☱', layer: 'Wallet',          verb: 'MAP',      verbDesc: 'chart holdings & flows' }
  };
  // King Wen number by 'lowerTrigram|upperTrigram'
  const KW = {
    '111|111':1,'000|000':2,'100|010':3,'010|001':4,'111|010':5,'010|111':6,'010|000':7,'000|010':8,
    '111|011':9,'110|111':10,'111|000':11,'000|111':12,'101|111':13,'111|101':14,'001|000':15,'000|100':16,
    '100|110':17,'011|001':18,'110|000':19,'000|011':20,'100|101':21,'101|001':22,'000|001':23,'100|000':24,
    '100|111':25,'111|001':26,'100|001':27,'011|110':28,'010|010':29,'101|101':30,'001|110':31,'011|100':32,
    '001|111':33,'111|100':34,'000|101':35,'101|000':36,'101|011':37,'110|101':38,'001|010':39,'010|100':40,
    '110|001':41,'100|011':42,'111|110':43,'011|111':44,'000|110':45,'011|000':46,'010|110':47,'011|010':48,
    '101|110':49,'011|101':50,'100|100':51,'001|001':52,'001|011':53,'110|100':54,'101|100':55,'001|101':56,
    '011|011':57,'110|110':58,'010|011':59,'110|010':60,'110|011':61,'001|100':62,'101|010':63,'010|101':64
  };
  const NAMES = {
    1:['Qián','The Creative'],2:['Kūn','The Receptive'],3:['Zhūn','Difficulty at the Beginning'],4:['Méng','Youthful Folly'],
    5:['Xū','Waiting'],6:['Sòng','Conflict'],7:['Shī','The Army'],8:['Bǐ','Holding Together'],
    9:['Xiǎo Chù','Small Taming'],10:['Lǚ','Treading'],11:['Tài','Peace'],12:['Pǐ','Standstill'],
    13:['Tóng Rén','Fellowship'],14:['Dà Yǒu','Great Possession'],15:['Qiān','Modesty'],16:['Yù','Enthusiasm'],
    17:['Suí','Following'],18:['Gǔ','Work on the Decayed'],19:['Lín','Approach'],20:['Guān','Contemplation'],
    21:['Shì Kè','Biting Through'],22:['Bì','Grace'],23:['Bō','Splitting Apart'],24:['Fù','Return'],
    25:['Wú Wàng','Innocence'],26:['Dà Chù','Great Taming'],27:['Yí','Nourishment'],28:['Dà Guò','Great Exceeding'],
    29:['Kǎn','The Abysmal'],30:['Lí','The Clinging'],31:['Xián','Influence'],32:['Héng','Duration'],
    33:['Dùn','Retreat'],34:['Dà Zhuàng','Great Power'],35:['Jìn','Progress'],36:['Míng Yí','Darkening of the Light'],
    37:['Jiā Rén','The Family'],38:['Kuí','Opposition'],39:['Jiǎn','Obstruction'],40:['Xiè','Deliverance'],
    41:['Sǔn','Decrease'],42:['Yì','Increase'],43:['Guài','Breakthrough'],44:['Gòu','Coming to Meet'],
    45:['Cuì','Gathering Together'],46:['Shēng','Pushing Upward'],47:['Kùn','Oppression'],48:['Jǐng','The Well'],
    49:['Gé','Revolution'],50:['Dǐng','The Cauldron'],51:['Zhèn','The Arousing'],52:['Gèn','Keeping Still'],
    53:['Jiàn','Development'],54:['Guī Mèi','The Marrying Maiden'],55:['Fēng','Abundance'],56:['Lǚ','The Wanderer'],
    57:['Xùn','The Gentle'],58:['Duì','The Joyous'],59:['Huàn','Dispersion'],60:['Jié','Limitation'],
    61:['Zhōng Fú','Inner Truth'],62:['Xiǎo Guò','Small Exceeding'],63:['Jì Jì','After Completion'],64:['Wèi Jì','Before Completion']
  };
  // Dial order: King Wen ba gua arrangement, clockwise from top
  const DIAL = ['101','000','110','111','010','011','001','100'];
  function fromLines(lines) {
    const lower = lines.slice(0, 3).join('');
    const upper = lines.slice(3, 6).join('');
    const kw = KW[lower + '|' + upper];
    const [pinyin, english] = NAMES[kw];
    const dec = lines.reduce((a, b, i) => a + (b << i), 0);
    return {
      kw, pinyin, english,
      char: String.fromCodePoint(0x4DC0 + kw - 1),
      binary: lines.slice().reverse().join(''), // read top line first
      dec, hex: '0x' + dec.toString(16).toUpperCase().padStart(2, '0'),
      lower: TRI[lower], upper: TRI[upper]
    };
  }
  return { TRI, KW, NAMES, DIAL, fromLines };
})();

export const { TRI, KW, NAMES, DIAL, fromLines } = OOHEX;
export default OOHEX;
