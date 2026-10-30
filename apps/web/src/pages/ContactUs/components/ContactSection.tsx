import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Phone, Mail } from "lucide-react";
import { useStoreSettings, parseStoreHours } from "../../../hooks/use-content";
import { PHONE_HINT, formatUSPhone, isValidOptionalPhone, normalizeUSPhone } from "../../../lib/phone";

type Field = "name" | "phone" | "email" | "subject" | "message";
type FormState = Record<Field, string>;

const EMPTY: FormState = { name: "", phone: "", email: "", subject: "", message: "" };
// Same limits as the API (apps/api/src/services/content.service.ts)
const MAX = { name: 100, email: 254, subject: 150, message: 5000 } as const;

function validate(f: FormState): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (!f.name.trim()) e.name = "Please enter your name";
  if (!f.email.trim()) e.email = "Please enter your email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Please enter a valid email address";
  if (!isValidOptionalPhone(f.phone)) e.phone = PHONE_HINT;
  if (!f.message.trim()) e.message = "Please write a message";
  return e;
}

const inputClass = (hasError: boolean) =>
  `w-full h-12 border rounded-lg px-4 text-body-md shadow-sm focus:outline-none focus:border-green-500 transition ${
    hasError ? "border-red-400" : "border-text-100"
  }`;

const ContactSection = () => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { data: settings } = useStoreSettings();

  // All of this comes from Admin → Settings; sections without data are hidden
  const hours = parseStoreHours(settings?.store_hours);
  const storeName = settings?.store_name?.trim() || "Amma Grocery";
  const storeAddress = settings?.store_address?.trim();
  const storePhone = settings?.store_phone?.trim();
  const storeEmail = settings?.store_email?.trim();
  const rawMap = settings?.store_map_embed?.trim() || "";
  const mapEmbed = /^https:\/\/(www\.)?google\.com\/maps\/embed/.test(rawMap) ? rawMap : "";
  const directionsUrl = storeAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`
    : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as Field;
    setForm((f) => ({ ...f, [name]: e.target.value }));
    // clear a field's error as soon as it's edited
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Tidy a valid number into (610) 555-0123 when the visitor leaves the field
  const handlePhoneBlur = () => {
    const normalized = normalizeUSPhone(form.phone);
    if (normalized) setForm((f) => ({ ...f, phone: formatUSPhone(normalized) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validate(form);
    setErrors(found);
    const firstInvalid = (Object.keys(EMPTY) as Field[]).find((k) => found[k]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_BASE}/content/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone.trim() }),
      });

      if (res.ok) {
        toast.success("Message sent! We'll get back to you soon.");
        setForm(EMPTY);
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error?.message || "Failed to send message. Please try again.");
      }
    } catch {
      toast.error("Unable to connect. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`contact-${field}-error`} className="text-red-500 text-body-sm mt-1.5">
        {errors[field]}
      </p>
    ) : null;

  const fieldProps = (field: Field) => ({
    id: `contact-${field}`,
    name: field,
    value: form[field],
    onChange: handleChange,
    "aria-invalid": !!errors[field],
    "aria-describedby": errors[field] ? `contact-${field}-error` : undefined,
  });

  const hasDetails = !!(storeAddress || storePhone || storeEmail);

  return (
    <section className="w-full bg-white py-10 sm:py-14 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-[1200px]">

        {/* MAP */}
        {mapEmbed && (
          <div className="overflow-hidden rounded-2xl h-[260px] sm:h-[340px] lg:h-[420px] mb-10 lg:mb-16">
            <iframe
              title="Store location map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapEmbed}
            ></iframe>
          </div>
        )}

        {/* TITLE + SUBTEXT */}
        <div className="text-center max-w-[750px] mx-auto">
          <h2 className="text-h3 font-semibold text-text-500">
            CONTACT <span className="text-green-500">INFO</span>
          </h2>
          <p className="text-body-lg mt-3 sm:mt-4 text-text-400">
            Questions about an order, a product you can't find, or feedback for us? Send a message
            and we'll get back to you.
          </p>
        </div>

        {/* CONTENT: store info (left on desktop, two columns on tablets) + form */}
        <div className="mt-10 lg:mt-16 grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-16 xl:gap-20">

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-1 lg:content-start">
            {hours.length > 0 && (
              <div>
                <h3 className="text-h6 font-semibold text-text-500 mb-4">Store Hours</h3>
                <dl className="space-y-3">
                  {hours.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-4 text-body-md text-text-500">
                      <dt>{item.day}</dt>
                      <dd className={`text-right ${item.time.toLowerCase().includes("closed") ? "text-red-500" : ""}`}>
                        {item.time}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div>
              <h3 className="text-h6 font-semibold text-text-500 mb-3">{storeName}</h3>
              {hasDetails && (
                <ul className="space-y-1 text-body-md text-text-500">
                  {storeAddress && (
                    <li>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 py-2 hover:text-green-600"
                      >
                        <MapPin size={20} className="text-green-500 shrink-0 mt-0.5" aria-hidden />
                        <span>
                          {storeAddress}
                          <span className="block text-body-sm text-green-600 group-hover:underline">Get directions</span>
                        </span>
                      </a>
                    </li>
                  )}
                  {storePhone && (
                    <li>
                      <a
                        href={`tel:${storePhone.replace(/[^\d+]/g, "")}`}
                        className="flex items-center gap-3 min-h-[44px] py-2 hover:text-green-600"
                      >
                        <Phone size={20} className="text-green-500 shrink-0" aria-hidden />
                        <span>{storePhone}</span>
                      </a>
                    </li>
                  )}
                  {storeEmail && (
                    <li>
                      <a
                        href={`mailto:${storeEmail}`}
                        className="flex items-center gap-3 min-h-[44px] py-2 hover:text-green-600"
                      >
                        <Mail size={20} className="text-green-500 shrink-0" aria-hidden />
                        <span className="min-w-0 [overflow-wrap:anywhere]">{storeEmail}</span>
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* FORM */}
          <form ref={formRef} className="w-full min-w-0 space-y-5 sm:space-y-6" onSubmit={handleSubmit} noValidate>
            <h3 className="sr-only">Send us a message</h3>

            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label htmlFor="contact-name" className="block text-text-400 text-body-sm sm:text-body-md mb-2">
                  Name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  maxLength={MAX.name}
                  placeholder="Enter your name"
                  className={inputClass(!!errors.name)}
                  {...fieldProps("name")}
                />
                {errorText("name")}
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-text-400 text-body-sm sm:text-body-md mb-2">
                  Phone <span className="text-text-200">(optional)</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  placeholder="(610) 555-0123"
                  className={inputClass(!!errors.phone)}
                  {...fieldProps("phone")}
                  onBlur={handlePhoneBlur}
                />
                {errorText("phone")}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label htmlFor="contact-email" className="block text-text-400 text-body-sm sm:text-body-md mb-2">
                  Email
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={MAX.email}
                  placeholder="you@example.com"
                  className={inputClass(!!errors.email)}
                  {...fieldProps("email")}
                />
                {errorText("email")}
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-text-400 text-body-sm sm:text-body-md mb-2">
                  Subject <span className="text-text-200">(optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={MAX.subject}
                  placeholder="What's it about?"
                  className={inputClass(!!errors.subject)}
                  {...fieldProps("subject")}
                />
                {errorText("subject")}
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-text-400 text-body-sm sm:text-body-md mb-2">
                Message
              </label>
              <textarea
                maxLength={MAX.message}
                placeholder="Write your message..."
                className={`w-full min-h-[140px] sm:min-h-[160px] resize-y border rounded-xl p-4 text-body-md shadow-sm focus:outline-none focus:border-green-500 transition ${
                  errors.message ? "border-red-400" : "border-text-100"
                }`}
                {...fieldProps("message")}
              ></textarea>
              {errorText("message")}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 bg-background-secondary border border-green-600 text-green-600 rounded-xl font-medium hover:bg-green-500 hover:text-white transition text-body-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
