const pricing = {
  "Mirror Booth": {
    base: 650,
    includedHours: 2,
    extraHour: 150,
  },
  guestFees: [
    { min: 401, fee: 550 },
    { min: 301, fee: 400 },
    { min: 201, fee: 250 },
    { min: 151, fee: 150 },
    { min: 101, fee: 75 },
  ],
  eventFees: {
    "Corporate event": 150,
    "Branding event": 200,
  },
  customBackdropFee: 175,
};

const businessEmail = "hello@posedphotoboothco.com";
const form = document.querySelector("#quote-form");
const steps = Array.from(document.querySelectorAll(".form-step"));
const progressText = document.querySelector("#progress-text");
const progressFill = document.querySelector("#progress-fill");
const prevButton = document.querySelector("#prev-step");
const nextButton = document.querySelector("#next-step");
const submitButton = document.querySelector("#show-quote");
const message = document.querySelector("#form-message");
const guestInput = form.elements.guestCount;
const guestValue = document.querySelector("#guest-count-value");
const quoteTotal = document.querySelector("#quote-total");
const quoteSummary = document.querySelector("#quote-summary");
const emailQuote = document.querySelector("#email-quote");

let currentStep = 0;
let lastQuote = null;

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getValue(name) {
  return form.elements[name]?.value || "";
}

function selectedBooth() {
  return form.querySelector("input[name='booth']:checked").value;
}

function showStep(index) {
  currentStep = index;
  steps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === currentStep);
  });
  progressText.textContent = "A few quick questions";
  progressFill.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  prevButton.hidden = currentStep === 0;
  nextButton.hidden = currentStep === steps.length - 1;
  submitButton.hidden = currentStep !== steps.length - 1;
  message.textContent = "";
}

function validateCurrentStep() {
  const fields = Array.from(steps[currentStep].querySelectorAll("input, select, textarea"));
  const invalidField = fields.find((field) => !field.checkValidity());

  if (invalidField) {
    invalidField.reportValidity();
    message.textContent = "Please complete the required fields before continuing.";
    return false;
  }

  return true;
}

function validateAllSteps() {
  for (const [stepIndex, step] of steps.entries()) {
    const fields = Array.from(step.querySelectorAll("input, select, textarea"));
    const invalidField = fields.find((field) => !field.checkValidity());

    if (invalidField) {
      showStep(stepIndex);
      invalidField.reportValidity();
      message.textContent = "Please complete this question before getting your quote.";
      return false;
    }
  }

  return true;
}

function calculateQuote() {
  const booth = selectedBooth();
  const boothPricing = pricing[booth];
  const hours = Number(getValue("hours"));
  const guestCount = Number(getValue("guestCount"));
  const eventType = getValue("eventType");
  const backdrop = getValue("backdrop");
  const extraHours = Math.max(0, hours - boothPricing.includedHours);
  const guestFee = pricing.guestFees.find((tier) => guestCount >= tier.min)?.fee || 0;
  const eventFee = pricing.eventFees[eventType] || 0;
  const backdropFee = backdrop === "Custom backdrop" ? pricing.customBackdropFee : 0;
  const total =
    boothPricing.base +
    extraHours * boothPricing.extraHour +
    guestFee +
    eventFee +
    backdropFee;

  return {
    total,
    booth,
    hours,
    guestCount,
    eventType,
    eventDate: getValue("eventDate"),
    eventTime: getValue("eventTime"),
    location: getValue("location"),
    printFormat: getValue("printFormat"),
    photoStyle: getValue("photoStyle"),
    backdrop,
    setupLocation: getValue("setupLocation"),
    powerAccess: getValue("powerAccess"),
    notes: getValue("notes"),
    name: getValue("name"),
    email: getValue("email"),
    phone: getValue("phone"),
  };
}

function quoteText(quote) {
  const details = [
    `Name: ${quote.name}`,
    `Email: ${quote.email}`,
    `Phone: ${quote.phone}`,
    `Event: ${quote.eventType}`,
    `Date: ${quote.eventDate || "Not provided"}`,
    `Time: ${quote.eventTime || "Not provided"}`,
    `Venue/City: ${quote.location || "Not provided"}`,
    `Guests: ${quote.guestCount}`,
    `Booth: ${quote.booth}`,
    `Booth time: ${quote.hours} hours`,
    `Print format: ${quote.printFormat}`,
    `Photo style: ${quote.photoStyle}`,
    `Backdrop: ${quote.backdrop}`,
    `Setup location: ${quote.setupLocation}`,
    `Power access: ${quote.powerAccess}`,
    `Notes: ${quote.notes || "None"}`,
    `Estimated quote: ${money(quote.total)}`,
  ];

  return details.join("\n");
}

function updateQuoteResult() {
  lastQuote = calculateQuote();
  quoteTotal.textContent = money(lastQuote.total);
  quoteSummary.textContent = `${lastQuote.booth} for ${lastQuote.guestCount} guests, ${lastQuote.hours} hours, ${lastQuote.printFormat}, ${lastQuote.photoStyle}.`;

  const subject = encodeURIComponent(`POSED quote for ${lastQuote.eventType || "my event"}`);
  const body = encodeURIComponent(
    `Hi POSED Photo Booth Co.,\n\nPlease email me this quote and availability details.\n\n${quoteText(lastQuote)}\n\nI understand this is an estimate and final pricing may change based on travel, venue needs, availability, and custom requests.`
  );

  emailQuote.href = `mailto:${businessEmail}?subject=${subject}&body=${body}`;
  emailQuote.classList.remove("is-disabled");
  emailQuote.removeAttribute("aria-disabled");
}

guestInput.addEventListener("input", () => {
  guestValue.textContent = guestInput.value;
});

nextButton.addEventListener("click", () => {
  if (validateCurrentStep()) {
    showStep(Math.min(currentStep + 1, steps.length - 1));
  }
});

prevButton.addEventListener("click", () => {
  showStep(Math.max(currentStep - 1, 0));
});

form.addEventListener("input", () => {
  if (lastQuote) {
    updateQuoteResult();
  }
});

form.addEventListener("change", () => {
  if (lastQuote) {
    updateQuoteResult();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateAllSteps()) {
    return;
  }

  updateQuoteResult();
  message.textContent =
    "Your quote has been submitted. We'll confirm availability and contact you by email or phone with next steps. A deposit is required to reserve your date.";
});

showStep(0);
