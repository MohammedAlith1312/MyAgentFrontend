"use client";

import { useState } from "react";
import { Send, Paperclip, Loader2, CheckCircle } from "lucide-react";
import Swal from 'sweetalert2';

import { Button } from "../components/UI/Button";
import { Input } from "../components/UI/Input";
import { Textarea } from "../components/UI/TextArea";
import { Alert } from "../components/UI/Alert";
import { apiClient } from "../lib/api";

export default function SendEmailPage() {
  const [form, setForm] = useState({
    to: "",
    subject: "",
    body: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.sendEmail({
        to: form.to,
        subject: form.subject,
        body: form.body,
      });

      setForm({ to: "", subject: "", body: "" });
      setAttachments([]);

      // Gmail-style bottom-left toast
      Swal.fire({
        toast: true,
        position: 'bottom-start',
        icon: undefined, // No icon for pure Gmail look, or use 'success' if preferred
        title: 'Message sent',
        showConfirmButton: false,
        timer: 5000,
        background: '#323232',
        color: '#ffffff',
        customClass: {
          popup: 'rounded-md px-4 py-3 shadow-lg',
          title: 'text-sm font-normal'
        },
        showClass: {
          popup: 'animate__animated animate__fadeInUp'
        }
      });

    } catch (err: any) {
      console.error(err);
      Swal.fire({
        toast: true,
        position: 'bottom-start',
        title: err.message || "Failed to send email",
        showConfirmButton: false,
        timer: 5000,
        background: '#323232',
        color: '#ffffff',
        customClass: {
          popup: 'rounded-md px-4 py-3 shadow-lg',
          title: 'text-sm font-normal'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttachment = (files: FileList) => {
    const newAttachments = Array.from(files);
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Message</h1>
          <p className="mt-2 text-lg text-gray-600">
            Compose and send emails via Gmail integration
          </p>
        </div>



        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                  <Input
                    type="email"
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    placeholder="recipient@example.com"
                    required
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all rounded-lg text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Email subject"
                    required
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium rounded-lg text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <Textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Type your message here..."
                    rows={12}
                    required
                    className="min-h-[200px] bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all p-4 resize-y rounded-lg leading-relaxed text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Attachments
                  </label>
                  <div className="group border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 hover:border-blue-300 transition-all">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => e.target.files && handleAttachment(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                    >
                      <div className="p-3 bg-blue-50 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <Paperclip className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        Click to upload files
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Supports multiple files
                      </span>
                    </label>
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-white rounded-md border border-gray-100">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() =>
                              setAttachments(attachments.filter((_, i) => i !== index))
                            }
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-8">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-medium rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm({ to: "", subject: "", body: "" });
                    setAttachments([]);
                  }}
                  disabled={loading}
                  className="px-6 h-11 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  Discard
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() =>
              setForm({
                ...form,
                subject: "Follow-up",
                body: "Hi,\n\nJust following up on our previous conversation.\n\nBest regards,\n[Your Name]",
              })
            }
            className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Follow-up</h4>
            <p className="text-sm text-gray-500">Standard follow-up email</p>
          </button>
          <button
            onClick={() =>
              setForm({
                ...form,
                subject: "Meeting Request",
                body: "Hi,\n\nI'd like to schedule a meeting to discuss...\n\nPlease let me know your availability.\n\nBest,\n[Your Name]",
              })
            }
            className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Meeting Request</h4>
            <p className="text-sm text-gray-500">Request a meeting</p>
          </button>
          <button
            onClick={() =>
              setForm({
                ...form,
                subject: "Document Review",
                body: "Hi,\n\nPlease find the attached document for your review.\n\nLooking forward to your feedback.\n\nRegards,\n[Your Name]",
              })
            }
            className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Document Review</h4>
            <p className="text-sm text-gray-500">Send documents for review</p>
          </button>
        </div>
      </div>
    </div>
  );
}