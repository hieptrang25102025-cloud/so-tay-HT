import { Material, ParsedVoiceResult, ParsedVoiceItem } from '../types';

// Vietnamese number words dictionary
const VIETNAMESE_NUMBERS: Record<string, number> = {
  'nửa': 0.5,
  'rưỡi': 0.5,
  'không': 0,
  'một': 1,
  'mốt': 1,
  'hai': 2,
  'ba': 3,
  'bốn': 4,
  'tư': 4,
  'năm': 5,
  'lăm': 5,
  'sáu': 6,
  'bảy': 7,
  'bẩy': 7,
  'tám': 8,
  'chín': 9,
  'mười': 10,
  'chục': 10,
  'trăm': 100
};

// Common Vietnamese units
const COMMON_UNITS = [
  'sợi', 'cái', 'mét', 'cuộn', 'bộ', 'hộp', 'thanh', 
  'kg', 'kí', 'cặp', 'bịch', 'ống', 'bình', 'bóng', 'chiếc', 'cây', 'lon', 'gói', 'thùng'
];

/**
 * Convert Vietnamese number phrases or digits to numeric value
 */
export function parseVietnameseNumber(text: string): number | null {
  if (!text) return null;
  const clean = text.trim().toLowerCase();
  
  // Direct digit
  const directDigit = parseFloat(clean);
  if (!isNaN(directDigit)) return directDigit;

  // Single word lookup
  if (VIETNAMESE_NUMBERS[clean] !== undefined) {
    return VIETNAMESE_NUMBERS[clean];
  }

  const words = clean.split(/\s+/);
  if (words.length === 1 && VIETNAMESE_NUMBERS[words[0]] !== undefined) {
    return VIETNAMESE_NUMBERS[words[0]];
  }

  // Handle compound words like "mười hai" (12), "hai mươi" (20), "hai mươi lăm" (25)
  if (words.length === 2) {
    if (words[0] === 'mười') {
      const unit = VIETNAMESE_NUMBERS[words[1]];
      if (unit !== undefined) return 10 + unit;
    }
    if (words[1] === 'mươi' || words[1] === 'chục') {
      const tens = VIETNAMESE_NUMBERS[words[0]];
      if (tens !== undefined) return tens * 10;
    }
  }

  if (words.length === 3 && (words[1] === 'mươi' || words[1] === 'chục')) {
    const tens = VIETNAMESE_NUMBERS[words[0]];
    const unit = VIETNAMESE_NUMBERS[words[2]];
    if (tens !== undefined && unit !== undefined) {
      return tens * 10 + unit;
    }
  }

  return null;
}

/**
 * Extract customer name from spoken or typed Vietnamese sentence
 * Matches: "Gắn cho MTX", "cho anh Tuấn", "thay cho chú Minh", "khách hàng chị Lan"
 */
export function extractCustomerName(text: string): string {
  // Regex 1: "gắn cho / thay cho / cho khách / cho [danh xưng] Tên"
  const m1 = text.match(/(?:cho\s+khách(?:\s+hàng)?\s+|gắn\s+cho\s+|thay\s+cho\s+|lắp\s+cho\s+|xuất\s+cho\s+|bán\s+cho\s+|cho\s+|khách\s+)(?:(anh|chị|chú|bác|cô|em)\s+)?([A-Za-z0-9ĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ][A-Za-z0-9_đàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]*(?:\s+[A-Za-z0-9_ĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ][A-Za-z0-9_đàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]*)*)/i);

  if (m1) {
    const title = m1[1] ? (m1[1].charAt(0).toUpperCase() + m1[1].slice(1) + ' ') : '';
    let name = m1[2].trim();
    // Stop at number, unit, or connector words like "và", "với"
    name = name.split(/\s+(\d+|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|và|với)\b/i)[0].trim();
    if (name.length > 0) {
      return (title + name).trim();
    }
  }

  // Regex 2: Direct title + name (e.g. "anh Tuấn", "chú Nam")
  const m2 = text.match(/\b(anh|chị|chú|bác|cô|em)\s+([A-Z0-9ĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ][a-z0-9_đàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]*)/i);
  if (m2) {
    return (m2[1].charAt(0).toUpperCase() + m2[1].slice(1) + ' ' + m2[2].trim());
  }

  return '';
}

/**
 * Intelligent Vietnamese NLP Sentence Parser
 * Analyzes natural language input and extracts customer, materials, quantities, units
 */
export function parseVoiceInput(
  rawText: string,
  existingMaterials: Material[] = []
): ParsedVoiceResult {
  const cleanText = rawText.trim();
  const customerName = extractCustomerName(cleanText);

  // Split into individual clauses by " và ", " với ", ",", ";"
  const clauses = cleanText
    .split(/\s+và\s+|\s+với\s+|,\s*|;\s*/)
    .map(c => c.trim())
    .filter(Boolean);

  const items: ParsedVoiceItem[] = [];

  for (const rawClause of clauses) {
    // 1. Clean customer references and action words from this clause
    let clause = rawClause
      .replace(/^(hôm nay|vừa|đã|mới|vừa rồi)\s+/i, '')
      .replace(/^(?:gắn|thay|lắp|xuất|bán|lấy|dùng|xài)\s+/i, '')
      .replace(/^cho\s+(?:khách(?:\s+hàng)?\s+)?(?:anh|chị|chú|bác|cô|em)?\s*[A-Za-z0-9_À-ỹ]+\s*/i, '')
      .replace(/^(?:khách(?:\s+hàng)?\s+)?(?:anh|chị|chú|bác|cô|em)\s+[A-Za-z0-9_À-ỹ]+\s*/i, '')
      .replace(/\s+cho\s+(?:khách(?:\s+hàng)?\s+)?(?:anh|chị|chú|bác|cô|em)?\s*[A-Za-z0-9_À-ỹ]+$/i, '')
      .replace(/^(và|với|kèm|thêm)\s+/i, '')
      .trim();

    if (!clause) continue;

    // 2. Parse quantity and unit
    let quantity = 1;
    let unit = 'Cái';
    let itemName = clause;

    // Pattern A: <Number> <Unit>? <ItemName> (e.g. "2 bóng đèn H4", "2 sợi dây CORO A123")
    const matchA = clause.match(/^(\d+|một|hai|ba|bốn|tư|năm|lăm|sáu|bảy|tám|chín|mười)\s*([a-zA-ZÀ-ỹ]+)?\s+(.*)$/i);
    // Pattern B: <ItemName> <Number> <Unit>? (e.g. "Bóng đèn H4 2 cái", "Dây điện CV 2.5 10 mét")
    const matchB = clause.match(/^(.*?)\s+(\d+|một|hai|ba|bốn|tư|năm|lăm|sáu|bảy|tám|chín|mười)\s*([a-zA-ZÀ-ỹ]+)?$/i);

    if (matchA) {
      const q = parseVietnameseNumber(matchA[1]);
      if (q !== null) quantity = q;
      const candidateUnit = (matchA[2] || '').toLowerCase();
      const candidateRest = (matchA[3] || '').trim();

      if (COMMON_UNITS.includes(candidateUnit)) {
        unit = candidateUnit.charAt(0).toUpperCase() + candidateUnit.slice(1);
        // Special case: "bóng" followed by "đèn" (e.g. "2 bóng đèn H4" -> Name: "Bóng đèn H4")
        if (candidateUnit === 'bóng' && candidateRest.toLowerCase().startsWith('đèn')) {
          itemName = 'Bóng ' + candidateRest;
        } else {
          itemName = candidateRest;
        }
      } else if (candidateUnit) {
        itemName = candidateUnit + ' ' + candidateRest;
      } else {
        itemName = candidateRest;
      }
    } else if (matchB) {
      const q = parseVietnameseNumber(matchB[2]);
      if (q !== null) quantity = q;
      const candidateUnit = (matchB[3] || '').toLowerCase();
      if (COMMON_UNITS.includes(candidateUnit)) {
        unit = candidateUnit.charAt(0).toUpperCase() + candidateUnit.slice(1);
      }
      itemName = matchB[1].trim();
    }

    // Capitalize item name properly
    if (itemName.length > 0) {
      itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
    }

    // 3. Match against existing catalog if present
    let matchedMaterial: Material | undefined = undefined;

    // A. Match by code or exact name
    for (const mat of existingMaterials) {
      const codeRegex = new RegExp(`\\b${mat.code}\\b`, 'i');
      const nameRegex = new RegExp(`${mat.name.toLowerCase()}`, 'i');
      if (codeRegex.test(itemName) || nameRegex.test(itemName.toLowerCase())) {
        matchedMaterial = mat;
        break;
      }
    }

    // B. Fuzzy keyword match
    if (!matchedMaterial) {
      const lowerItem = itemName.toLowerCase();
      matchedMaterial = existingMaterials.find(mat => {
        const parts = mat.name.toLowerCase().split(' ');
        return parts.some(p => p.length >= 3 && lowerItem.includes(p));
      });
    }

    if (matchedMaterial) {
      items.push({
        material_name: matchedMaterial.name,
        material_code: matchedMaterial.code,
        quantity,
        unit: matchedMaterial.unit || unit,
        matched_material_id: matchedMaterial.id,
        matched_material: matchedMaterial
      });
    } else {
      items.push({
        material_name: itemName || clause,
        quantity,
        unit
      });
    }
  }

  // Deduplicate items
  const combinedItems: ParsedVoiceItem[] = [];
  for (const it of items) {
    const existing = combinedItems.find(x => 
      (it.matched_material_id && x.matched_material_id === it.matched_material_id) ||
      (it.material_name.toLowerCase() === x.material_name.toLowerCase())
    );
    if (existing) {
      existing.quantity += it.quantity;
    } else {
      combinedItems.push(it);
    }
  }

  return {
    customer_name: customerName,
    notes: customerName ? `Gắn cho khách ${customerName}` : cleanText,
    raw_text: cleanText,
    items: combinedItems.length > 0 ? combinedItems : [
      {
        material_name: cleanText,
        quantity: 1,
        unit: 'Cái'
      }
    ],
    intent: 'USAGE',
    confidence: combinedItems.some(i => i.matched_material_id) ? 0.95 : 0.85
  };
}
