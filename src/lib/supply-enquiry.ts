const GLYVANTIX_RESEARCH_URL = "https://glyvantix.co.uk/";

export function buildSupplyEnquiryUrl(templateName: string, price: number): string {
  const params = new URLSearchParams({
    reason: "Documentation / Framework Enquiry",
    paymentMethod: "Bank transfer",
    message: [
      `I would like to request the GLYvantix Docs template: ${templateName}.`,
      `Listed price: $${price.toFixed(2)}.`,
      "Please confirm availability, payment instructions, and any review requirements before fulfilment.",
    ].join("\n"),
  });
  return `${GLYVANTIX_RESEARCH_URL}?${params.toString()}#enquiry`;
}