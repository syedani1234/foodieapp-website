export const validateRequiredFields = (fields, data) => {
  const missing = [];
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
};

export const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return null;
  }
};