function DecodeDateRange({ start, end }) {
    return {
      start: start ? new Date(start) : start,
      end: end ? new Date(end) : end,
    };
}

function fullUrlToId(fullUrl) {
    return fullUrl.split('/').pop() || '';
}

module.exports = { DecodeDateRange, fullUrlToId }