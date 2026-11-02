
const apiBaseUrl = (
  import.meta.env.VITE_API_URL || '/api'
).replace(/\/+$/, '');

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    });
  } catch (error) {
    console.error('API Network Error:', {
      url: `${apiBaseUrl}${path}`,
      message: error.message
    });

    throw new Error(
      'Unable to connect to server. Check backend URL, CORS, or internet connection.'
    );
  }

  const responseText =
    response.status === 204 ? '' : await response.text();

  let result = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new Error('The server returned an unreadable response.');
      }
    }
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
      `Request failed (HTTP ${response.status}).`
    );
  }

  return result;
}

export const dateToday = () =>
  new Date().toISOString().slice(0, 10);

export function listingImages(listing) {
  if (listing?.images?.length) return listing.images;
  return listing?.image?.url ? [listing.image] : [];
}

export function money(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
