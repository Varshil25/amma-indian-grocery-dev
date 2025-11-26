import React from "react";

const hours = [
  { day: "Monday", time: "Closed" },
  { day: "Tuesday", time: "10:00am - 8:00pm" },
  { day: "Wednesday", time: "10:00am - 8:00pm" },
  { day: "Thursday", time: "9:00am - 8:00pm" },
  { day: "Friday", time: "9:00am - 8:00pm" },
  { day: "Saturday", time: "9:00am - 6:00pm" },
  { day: "Sunday", time: "Closed" },
];

const ContactSection = () => {
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
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2873.129074908986!2d-80.19221738450817!3d43.51445267912656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b8c3b91923bb7%3A0xe4722d509dbb00c4!2s403%20Arkell%20Rd%2C%20Guelph%2C%20ON%20N1L%201E5%2C%20Canada!5e0!3m2!1sen!2sin!4v1705673530123!5m2!1sen!2sin"
          ></iframe>
        </div>

        {/* TITLE + SUBTEXT */}
        <div className="text-center max-w-[750px] mx-auto">
          <h2 className="text-h3 md:text-5xl font-semibold">CONTACT <span className="text-green-500">INFO</span> </h2>
          <p className="text-body-lg mt-4 text-text-400">
            We’re here to help you look and feel your best. Reach out to us with questions,
            feedback, or appointment request — we’d love to hear from you!
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

            <p className="mt-8 text-h6 font-semibold">Amma Grocery</p>
            <p className="text-body-lg text-text-500">ON L4N 9B3, Canada</p>
          </div>

          {/* FORM */}
          <form className="w-full lg:flex-1 space-y-6">

            {/* FIRST ROW */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-text-400 text-body-md mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full h-12 border border-gray-300 rounded-lg px-4 text-body-lg shadow-sm"
                />
              </div>

              <div>
                <label className="block text-text-400 text-body-md mb-2">Phone</label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  className="w-full h-12 border border-gray-300 rounded-lg px-4 text-body-lg shadow-sm"
                />
              </div>
            </div>

            {/* SECOND ROW */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-text-400 text-body-md mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full h-12 border border-gray-300 rounded-lg px-4 text-body-lg shadow-sm"
                />
              </div>

              <div>
                <label className="block text-text-400 text-body-md mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Enter Subject"
                  className="w-full h-12 border border-gray-300 rounded-lg px-4 text-body-lg shadow-sm"
                />
              </div>
            </div>

            {/* MESSAGE */}
            <div>
              <label className="block text-text-400 text-body-md mb-2">Message</label>
              <textarea
                placeholder="Write your message..."
                className="w-full min-h-[160px] border border-gray-300 rounded-xl p-4 text-body-lg shadow-sm"
              ></textarea>
            </div>

            {/* BUTTON */}
            <button className="w-full h-14 bg-background-secondary border border-green-600 text-green-600 rounded-xl font-medium hover:bg-green-500 hover:text-white transition text-body-lg">
              Contact Us
            </button>

          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
