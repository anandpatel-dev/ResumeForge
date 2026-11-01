// src/pages/Support.jsx
import React from "react";
import { motion } from "framer-motion";
import { ChatBubbleLeftRightIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";

export default function Support() {
  const contactMethods = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Live Chat",
      desc: "Chat with our support team for instant help.",
      action: "Start Chat",
    },
    {
      icon: EnvelopeIcon,
      title: "Email Support",
      desc: "Send us an email and get a response within 24 hours.",
      action: "Send Email",
    },
    {
      icon: PhoneIcon,
      title: "Call Us",
      desc: "Available Mon-Fri, 9AM - 6PM (IST).",
      action: "Call Now",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-indigo-700 mb-6">Support Center</h1>
        <p className="text-gray-600 mb-8">
          We’re here to help. Choose one of the options below to get in touch with our support team.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {contactMethods.map((method, i) => (
            <motion.div
              key={i}
              className="p-5 bg-indigo-50 rounded-lg shadow hover:shadow-md transition flex flex-col justify-between"
              whileHover={{ scale: 1.02 }}
            >
              <div>
                <method.icon className="h-10 w-10 text-indigo-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                <p className="text-sm text-gray-600">{method.desc}</p>
              </div>
              <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                {method.action}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
