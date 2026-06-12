const isOutOfStock = (product = {}) => product?.inStock === false;

export const sortProductsInStockFirst = (products = []) =>
  [...products]
    .map((product, index) => ({ product, index }))
    .sort((a, b) => {
      const stockDelta = Number(isOutOfStock(a.product)) - Number(isOutOfStock(b.product));
      if (stockDelta !== 0) return stockDelta;
      return a.index - b.index;
    })
    .map(({ product }) => product);

