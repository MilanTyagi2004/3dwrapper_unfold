import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidHeadline from './LiquidHeadline';
import './FaqSection.css';

const faqs = [
  {
    id: '01',
    question: 'What exactly is Demonic Fuel?',
    answer: 'A fast-dissolving caffeine energy strip designed to dissolve directly on your tongue. No cans. No mixing. No swallowing pills. \nJust…Tear. Tongue. Dissolve. Go.'
  },
  {
    id: '02',
    question: 'What’s inside each strip?',
    answer: '45mg caffeine + vitamin B12, B7, B6 & E'
  },
  {
    id: '03',
    question: 'What are the calories & macros?',
    answer: '0 sugar, 0 calories'
  },
  {
    id: '04',
    question: 'When should I use Demonic Fuel?',
    answer: 'Whenever you need to save time and lock the fuck in. Before a workout, deep-work session, study grind, gaming session, creative sprint: or whenever coffee feels like an unnecessary 20-minute ceremony.'
  },
  {
    id: '05',
    question: 'Why a caffeine strip instead of coffee, gum or an energy drink?',
    answer: 'Because energy doesn’t always need a cup or a can. The strip dissolves directly in your mouth, making caffeine portable, discreet and ridiculously convenient: no brewing, mixing, water or swallowing pills. The oral mucosa may also contribute to absorption while the strip dissolves, though the extent and speed depend on the formulation. Tear. Tongue. Dissolve. Go. \nYou can enjoy consuming your favourite products, but the strip helps you reaching your goals faster, since you lock-in faster'
  },
  {
    id: '06',
    question: 'When does Demonic Fuel launch?',
    answer: 'Join the waitlist and you’ll be among the first to know when the first drop goes live: with special cult access and exclusive launch perks. \nPs: Do share the founder card across your socials so that more members could join the cult via the QR on the cult card'
  },
  {
    id: '07',
    question: 'Who is Demonic Fuel built for?',
    answer: 'The unreasonably ambitious. Creators, athletes, founders, gamers, students, artists: and anyone obsessed with their craft.... Not everyone want wings ;)'
  }
];

export default function FaqSection() {
  const [openId, setOpenId] = useState(null);

  const toggleFaq = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq__header-container">
        <LiquidHeadline
          headline="KNOW YOUR FUEL"
          as="h2"
          className="faq__headline"
          isActive={true}
        />
        <p className="faq__subheadline">Frequently Asked Questions</p>
      </div>
      
      <div className="faq__list">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
              <button 
                className="faq__question-btn" 
                onClick={() => toggleFaq(faq.id)}
                aria-expanded={isOpen}
              >
                <div className="faq__q-text-group">
                  <span className="faq__number">{faq.id} //</span>
                  <span className="faq__question">{faq.question}</span>
                </div>
                <div className="faq__icon-wrapper">
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d={isOpen ? "M5 12H19" : "M12 5V19M5 12H19"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                </div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="faq__answer-wrapper"
                  >
                    <div className="faq__answer">
                      {faq.answer.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
