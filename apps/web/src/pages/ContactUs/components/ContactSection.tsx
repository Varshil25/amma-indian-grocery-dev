import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useStoreSettings } from "../../../hooks/use-content";

const defaultHours = [
  { day: "Monday", time: "Closed" },
  { day: "Tuesday", time: "10:00am - 8:00pm" },
  { day: "Wednesday", time: "10:00am - 8:00pm" },
  { day: "Thursday", time: "9:00am - 8:00pm" },
  { day: "Friday", time: "9:00am - 8:00pm" },
  { day: "Saturday", time: "9:00am - 6:00pm" },
  { day: "Sunday", time: "Closed" },
];

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { data: settings } = useStoreSettings();

  const hours: { day: string; time: string }[] = settings?.store_hours
    ? (() => { try { return JSON.parse(settings.store_hours); } catch { return defaultHours; } })()
    : defaultHours;

  const storeName = settings?.store_name || "Amma Grocery";
  const storeAddress = settings?.store_address || "ON L4N 9B3, Canada";
  const mapEmbed = settings?.store_map_embed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2873.129074908986!2d-80.19221738450817!3d43.51445267912656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b8c3b91923bb7%3A0xe4722d509dbb00c4!2s403%20Arkell%20Rd%2C%20Guelph%2C%20ON%20N1L%201E5%2C%20Canada!5e0!3m2!1sen!2sin!4v1705673530123!5m2!1sen!2sin";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in name, email, and message.");
      return;
    }

    setSubmitting(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_BASE}/content/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Message sent! We'll get back to you soon.");
        setForm({ name: "", phone: "", email: "", subject: "", message: "" });
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

  return (
    <section className="w-full bg-white py-20 select-none">
      <div className="container mx-auto px-6 max-w-[1200px]">

        {/* MAP */}
        <div className="overflow-hidden rounded-2xl h-[350px] sm:h-[420px] mb-16">
          <iframe
            title="Store Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapEmbed}
          ></iframe>
        </div>

        {/* TITLE + SUBTEXT */}
        <div className="text-center max-w-[750px] mx-auto">
          <h2 className="text-h3 md:text-5xl font-semibold">CONTACT <span className="text-green-500">INFO</span> </h2>
          <p className="text-body-lg mt-4 text-text-400">
            We're here to help you look and feel your best. Reach out to us with questions,
            feedback, or appointment request — we'd love to hear from you!
          </p>
        </div>

        {/* CONTENT */}
        <div className="mt-16 flex flex-col lg:flex-row gap-12 lg:gap-24">

          {/* HOURS LIST */}
          <div className="w-full lg:w-[280px]">
            <h3 className="text-h5 font-semibold mb-6">Hours:</h3>
            <div className="space-y-4">
              {hours.map((item, idx) => (
                <div key={idx} className="flex justify-between text-body-lg text-text-500">
                  <span>{item.day}</span>
                  <span className={`${item.time.includes("Closed") ? "text-red-500" : ""}`}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-h6 font-semibold">{storeName}</p>
            <p className="text-body-lg text-text-500">{storeAddress}</p>
          </div>

          {/* FORM */}
          <form className="w-full lg:flex-1 space-y-6" onSubmit={handleSubmit}>

            {/* FIRST ROW */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-text-400 text-body-md mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="w-full h-12 border border-text-100 rounded-lg px-4 text-body-lg shadow-sm focus:outline-none focus:border-green-500 transition"
                />
              </div>

              <div>
                <label className="block text-text-400 text-body-md mb-2">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full h-12 border border-text-100 rounded-lg px-4 text-body-lg shadow-sm focus:outline-none focus:border-green-500 transition"
                />
              </div>
            </div>

            {/* SECOND ROW */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-text-400 text-body-md mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                  className="w-full h-12 border border-text-100 rounded-lg px-4 text-body-lg shadow-sm focus:outline-none focus:border-green-500 transition"
                />
              </div>

              <div>
                <label className="block text-text-400 text-body-md mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Enter Subject"
                  className="w-full h-12 border border-text-100 rounded-lg px-4 text-body-lg shadow-sm focus:outline-none focus:border-green-500 transition"
                />
              </div>
            </div>

            {/* MESSAGE */}
            <div>
              <label className="block text-text-400 text-body-md mb-2">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write your message..."
                required
                className="w-full min-h-[160px] border border-text-100 rounded-xl p-4 text-body-lg shadow-sm focus:outline-none focus:border-green-500 transition"
              ></textarea>
            </div>

            {/* BUTTON */}
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
              ) : "Contact Us"}
            </button>

          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
