"use client";

import { useState } from "react";
import { Send, Paperclip, Loader2, CheckCircle } from "lucide-react";
import { Card } from "../components/UI/Card";
import { Button } from "../components/UI/Button";
import { Input } from "../components/UI/Input";
import { Textarea } from "../components/UI/TextArea";
import { Alert } from "../components/UI/Alert";
import { apiClient} from "../lib/api";

export default function SendEmailPage() {
  const [form, setForm] = useState({
    to: "",
    subject: "",
    body: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    setSuccess(false);

    try {
      await apiClient.sendEmail({
        to: form.to,
        subject: form.subject,
        body: form.body,
      });

      setSuccess(true);
      setForm({ to: "", subject: "", body: "" });
      setAttachments([]);
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleAttachment = (files: FileList) => {
    const newAttachments = Array.from(files);
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Send Email</h1>
        <p className="text-gray-400 mt-2">
          Send emails through Gmail integration
        </p>
      </div>

      {success && (
        <Alert variant="success" className="mb-4">
          <CheckCircle className="w-4 h-4" />
          Email sent successfully!
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">To</label>
            <Input
              type="email"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              placeholder="recipient@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Email subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Type your message here..."
              rows={8}
              required
              className="resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleAttachment(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Paperclip className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">
                  Click to upload attachments
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Supports multiple files
                </span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setAttachments(attachments.filter((_, i) => i !== index))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm({ to: "", subject: "", body: "" });
                setAttachments([]);
              }}
              disabled={loading}
            >
              Clear
            </Button>
            <Button type="submit" disabled={loading}>
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
          </div>
        </form>
      </Card>

      {/* Quick Templates */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() =>
              setForm({
                ...form,
                subject: "Follow-up",
                body: "Hi,\n\nJust following up on our previous conversation.\n\nBest regards,\n[Your Name]",
              })
            }
            className="p-4 text-left border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            <h4 className="font-medium mb-2">Follow-up</h4>
            <p className="text-sm text-gray-400">Standard follow-up email</p>
          </button>
          <button
            onClick={() =>
              setForm({
                ...form,
                subject: "Meeting Request",
                body: "Hi,\n\nI'd like to schedule a meeting to discuss...\n\nPlease let me know your availability.\n\nBest,\n[Your Name]",
              })
            }
            className="p-4 text-left border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            <h4 className="font-medium mb-2">Meeting Request</h4>
            <p className="text-sm text-gray-400">Request a meeting</p>
          </button>
          <button
            onClick={() =>
              setForm({
                ...form,
                subject: "Document Review",
                body: "Hi,\n\nPlease find the attached document for your review.\n\nLooking forward to your feedback.\n\nRegards,\n[Your Name]",
              })
            }
            className="p-4 text-left border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            <h4 className="font-medium mb-2">Document Review</h4>
            <p className="text-sm text-gray-400">Send documents for review</p>
          </button>
        </div>
      </Card>
    </div>
  );
}