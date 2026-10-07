const pricing = {
  "Mirror Booth": {
    base: 795,
    includedHours: 2,
    extraHour: 200,
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
};

const businessEmail = "contact@posedevents.com";
const formSubmitEndpoint = `https://formsubmit.co/ajax/${businessEmail}`;
const form = document.querySelector("#quote-form");
const contactForm = document.querySelector("#contact-form");
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
const contactMessage = document.querySelector("#contact-message");

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
  return "Mirror Booth";
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
  const extraHours = Math.max(0, hours - boothPricing.includedHours);
  const guestFee = pricing.guestFees.find((tier) => guestCount >= tier.min)?.fee || 0;
  const eventFee = pricing.eventFees[eventType] || 0;
  const total =
    boothPricing.base +
    extraHours * boothPricing.extraHour +
    guestFee +
    eventFee;

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
    `Hi POSED Events,\n\nI would like to reserve my date and confirm availability.\n\n${quoteText(lastQuote)}\n\nI understand final pricing is confirmed after you review my event details. Additional travel, venue requirements, extended hours, parking, or special requests may affect the final quote.`
  );

  emailQuote.href = `mailto:${businessEmail}?subject=${subject}&body=${body}`;
  emailQuote.classList.remove("is-disabled");
  emailQuote.removeAttribute("aria-disabled");
}

async function sendToBusinessEmail(data) {
  const response = await fetch(formSubmitEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: data,
  });

  if (!response.ok) {
    throw new Error("Form submission failed");
  }

  return response.json();
}

function quoteFormData(quote) {
  const data = new FormData();
  data.append("_subject", `New POSED Events quote request - ${quote.eventType || "Event"}`);
  data.append("_template", "table");
  data.append("Form type", "Quote request");
  data.append("Estimated quote", money(quote.total));
  data.append("Name", quote.name);
  data.append("Email", quote.email);
  data.append("Phone", quote.phone);
  data.append("Event type", quote.eventType);
  data.append("Event date", quote.eventDate || "Not provided");
  data.append("Event start time", quote.eventTime || "Not provided");
  data.append("Venue or city", quote.location || "Not provided");
  data.append("Guest count", quote.guestCount);
  data.append("Booth", quote.booth);
  data.append("Booth time", `${quote.hours} hours`);
  data.append("Print format", quote.printFormat);
  data.append("Photo style", quote.photoStyle);
  data.append("Setup location", quote.setupLocation);
  data.append("Power access", quote.powerAccess);
  data.append("Notes", quote.notes || "None");
  data.append(
    "Includes",
    "Delivery, setup and breakdown, an on-site attendant, unlimited sessions during the event, custom photo strip design, and instant prints."
  );
  data.append(
    "Fine print",
    "Final pricing is confirmed after we review the event details. Additional travel, venue requirements, extended hours, parking, or special requests may affect the final quote."
  );
  data.append("Full quote summary", quoteText(quote));

  return data;
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateAllSteps()) {
    return;
  }

  updateQuoteResult();
  submitButton.disabled = true;
  message.textContent = "Sending your quote request...";

  try {
    await sendToBusinessEmail(quoteFormData(lastQuote));
    message.textContent =
      "Your quote has been submitted. We'll confirm availability and contact you by email or phone with next steps. A deposit is required to reserve your date.";
  } catch (error) {
    message.textContent =
      "We could not send the form automatically. Please use the Reserve my date button so we still receive your details.";
  } finally {
    submitButton.disabled = false;
  }
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const submit = contactForm.querySelector("button[type='submit']");
  const data = new FormData(contactForm);
  submit.disabled = true;
  contactMessage.textContent = "Sending your message...";

  try {
    await sendToBusinessEmail(data);
    contactForm.reset();
    contactMessage.textContent = "Your message has been sent. We'll follow up by email.";
  } catch (error) {
    contactMessage.textContent =
      "We could not send the message automatically. Please email contact@posedevents.com.";
  } finally {
    submit.disabled = false;
  }
});

showStep(0);
