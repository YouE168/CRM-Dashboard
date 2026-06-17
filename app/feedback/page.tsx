"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Send, CheckCircle } from "lucide-react";

export default function FeedbackPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [overallSatisfaction, setOverallSatisfaction] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/login");
      return;
    }
    const savedProfile = localStorage.getItem(`profile_${currentUser}`);
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    // Load existing satisfaction rating
    const savedSatisfaction = localStorage.getItem(
      `satisfaction_${currentUser}`,
    );
    if (savedSatisfaction) {
      setOverallSatisfaction(parseInt(savedSatisfaction));
      setSubmitted(true);
    }
  }, [router]);

  const handleSubmit = () => {
    if (overallSatisfaction === 0) return;

    setIsSubmitting(true);
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      // Save satisfaction rating (1-5 stars)
      localStorage.setItem(
        `satisfaction_${currentUser}`,
        overallSatisfaction.toString(),
      );

      // Also save the full feedback object
      localStorage.setItem(
        `feedback_${currentUser}`,
        JSON.stringify({
          overall: overallSatisfaction,
          submittedAt: new Date().toISOString(),
        }),
      );

      // IF RATING IS 3 STARS OR LESS, SEND EMAIL TO JODY
      if (overallSatisfaction <= 3) {
        const userProfile = JSON.parse(
          localStorage.getItem(`profile_${currentUser}`) || "{}",
        );
        const userName = userProfile.name || currentUser.split("@")[0];
        const userEmail = currentUser;

        // Create email subject and body
        const subject = `⚠️ Low Satisfaction Rating from ${userName}`;
        const body = `Low Satisfaction Alert - Rural Community Partners

User: ${userName}
Email: ${userEmail}
Rating: ${overallSatisfaction}/5 stars
Submitted: ${new Date().toLocaleString()}

This user rated their experience ${overallSatisfaction} out of 5 stars.
Please follow up with them to address their concerns.

--
Rural Community Partners CRM`;

        // Open email client with pre-filled message
        window.location.href = `mailto:jody@hbcat.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 500);
  };

  const handleRateAgain = () => {
    setSubmitted(false);
  };

  if (!profile) return null;

  if (submitted && overallSatisfaction > 0) {
    const isLowRating = overallSatisfaction <= 3;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Your Feedback
                </h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 md:px-6 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-gray-500 mt-2">
              You rated us <strong>{overallSatisfaction} out of 5 stars</strong>
            </p>
            <div className="flex justify-center gap-1 my-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= overallSatisfaction
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>

            {isLowRating && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-700">
                  📧 We're sorry your experience wasn't great. An email has been
                  sent to our support team (jody@hbcat.org) and someone will
                  reach out to you shortly.
                </p>
              </div>
            )}

            <p className="text-sm text-gray-400 mt-3">
              Your satisfaction stars have been updated on the dashboard!
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.push("/")}
                className="flex-1 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleRateAgain}
                className="flex-1 px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Rate Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                Rate Your Experience
              </h1>
              <p className="text-xs text-gray-500">Help us improve</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              How would you rate your experience?
            </h2>
            <p className="text-gray-500 mt-1">
              Your feedback helps us serve you better
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Note: If you rate 3 stars or less, Jody will be notified via email
            </p>
          </div>

          <div className="flex justify-center gap-3 my-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setOverallSatisfaction(star)}
                className="focus:outline-none transform transition-all hover:scale-110"
              >
                <Star
                  className={`h-12 w-12 transition-all ${
                    star <= (hoveredStar || overallSatisfaction)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              {overallSatisfaction === 0 && "Click on a star to rate"}
              {overallSatisfaction === 1 &&
                "😞 Very Dissatisfied - Jody will be notified"}
              {overallSatisfaction === 2 &&
                "🙁 Dissatisfied - Jody will be notified"}
              {overallSatisfaction === 3 &&
                "😐 Neutral - Jody will be notified"}
              {overallSatisfaction === 4 && "🙂 Satisfied"}
              {overallSatisfaction === 5 && "😍 Very Satisfied"}
            </p>
            <button
              onClick={handleSubmit}
              disabled={overallSatisfaction === 0 || isSubmitting}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Rating
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
