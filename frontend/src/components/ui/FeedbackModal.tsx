'use client';

import React, { useState } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Job Completed!',
  description = 'Please rate your experience and provide feedback to help us track the quality of work.'
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }
    
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(rating, comment);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setComment('');
        setRating(5);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      setError(err?.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={() => !submitting && !submitted && onClose()} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden relative z-10 p-6 animate-scaleIn">
        {/* Close Button */}
        {!submitting && !submitted && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        )}

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center justify-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981] mb-4 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-base font-black text-slate-900">Feedback Submitted!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
              Thank you for helping us track the quality and impact of work on Crewora.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {description}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs px-3.5 py-2.5 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = hoverRating !== null ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 transition-transform active:scale-95 duration-100"
                    >
                      <Star 
                        size={28} 
                        className={`transition-colors stroke-[2.5] ${
                          isActive 
                            ? 'text-amber-500 fill-amber-500' 
                            : 'text-slate-200 fill-transparent'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
              </span>
            </div>

            {/* Comment Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Leave a Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about the service quality, professionalism, or timeline completion..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs placeholder-slate-400 outline-none focus:bg-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={submitting}
              className="py-3 bg-accent-600 hover:bg-accent-700 active:bg-accent-800 text-white font-extrabold text-xs rounded-xl"
            >
              Submit & Complete Job
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
