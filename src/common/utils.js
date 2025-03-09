function generatePages(total, take) {
  return Array.from(
    { length: Math.ceil(total / take) },
    (_, index) => index + 1,
  );
}
function getPageRange(page, take, total) {
  const start = (page - 1) * take + 1;
  let end = page * take;
  if (end > total) end = total;
  return { start, end };
}
export function getPagerInfo(list, page, take, total) {
  const pages = generatePages(total, take);
  const { start, end } = getPageRange(page, take, total);
  const lastPage = pages[pages?.length - 1];
  const disablePreviousButton = { disabled: page === 1 ? true : undefined };
  const disableNextButton = { disabled: page === lastPage || list?.length === 0 ? true : undefined };
  const disablePager = { disabled: list?.length === 0 ? true : undefined };
  return { start, end, pages, disablePreviousButton, disableNextButton, disablePager }
}
export function debounce(func, wait = 500) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
export const createdDate = function (date) {
  return new Date(
    date,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
}
export const ddmmyyyy = function (date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export const getScreenSize = () => {
  const height = window.innerHeight;
  if (height >= 1200)
    return 'xxl';
  else if (height >= 960) {
    return 'xl';
  } else if (height >= 800) {
    return 'lg';
  } else if (height >= 640) {
    return 'md';
  } else if (height >= 480) {
    return 'sm';
  } else {
    return 'xs';
  }
};
export const getTakeValue = (screenSize) => {
  switch (screenSize) {
    case 'xxl':
      return 15;
    case 'xl':
      return 15;
    case 'lg':
      return 10;
    case 'md':
      return 10;
    case 'sm':
      return 5;
    case 'xs':
    default:
      return 5;
  }
};
export const buildTreeView = function (data) {
  let tree = [];
  let lookup = {};
  data.forEach(item => lookup[item.value] = { ...item, showAction: false, children: [] });
  data.forEach(item => (item.parent_id ? lookup[item.parent_id].children : tree).push(lookup[item.value]));
  return tree;
}
export const copyToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    Alpine.store('toast').show(`Copied to clipboard.`, 'info');
  }).catch(() => {
    Alpine.store('toast').show(`Failed to copy`, 'error');
  });
}
export async function fileObjectToBuffer(file) {
  try {
    if (file && file instanceof File) {
      const fileBuffer = await file.arrayBuffer();
      return Buffer.from(fileBuffer);
    } else {
      throw new Error('File data not found or not in expected format');
    }
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return JSON.parse(decodeURIComponent(parts.pop().split(';').shift()));
  return null;
}