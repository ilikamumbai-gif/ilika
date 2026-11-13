export const getProductRebuildMessage = (rebuild) => {
  if (rebuild?.status === "triggered") {
    return "Website page rebuild requested. Wait for the Vercel deployment to finish before checking Google availability.";
  }
  if (rebuild?.status === "disabled") {
    return "Website pages have not been rebuilt. Configure PRODUCT_PRERENDER_DEPLOY_HOOK_URL on the backend so stock changes update the published pages Google reads.";
  }
  if (rebuild?.status === "error") {
    return "Website page rebuild failed. Check the Vercel deploy hook and redeploy the website before checking Google availability.";
  }
  return "Website page rebuild was not confirmed. Check the Vercel deployment before checking Google availability.";
};

export const getProductSaveMessage = (result = {}) => {
  const sync = result.merchantSync;
  const merchantMessage = sync?.status === "upserted"
    ? "Product data submitted to Merchant Center."
    : sync?.status === "error"
      ? `Merchant sync failed: ${sync.message || "Check the backend Merchant configuration."}`
      : sync?.status === "deleted"
        ? "Inactive product removed from Merchant Center."
        : `Merchant sync was not completed${sync?.reason ? `: ${sync.reason}` : "."}`;
  return `Product saved. ${merchantMessage} ${getProductRebuildMessage(result.prerenderRebuild)}`;
};
