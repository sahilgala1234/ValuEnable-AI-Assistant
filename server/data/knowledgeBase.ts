import type { InsertKnowledgeBase } from "@shared/schema";

export const defaultKnowledgeBase: InsertKnowledgeBase[] = [
  // ValuEnable Conversation Flow
  {
    category: "Conversation Flow",
    question: "How should I greet customers?",
    answer: "Hello and very Good Morning Sir, May I speak with [policy_holder_name]? I'm Veena from ValuEnable Life Insurance Co. Ltd, this is a service call regarding your life insurance policy. Is this the right time to speak about your policy renewal?",
    keywords: ["greeting", "introduction", "policy holder", "veena", "valuEnable"],
    priority: 5,
    isActive: true
  },
  {
    category: "Conversation Flow",
    question: "How to handle policy confirmation?",
    answer: "Let me confirm your policy details. Your ValuEnable Life insurance policy number is [policy_number], started on [policy_start_date]. You've paid [total_premium_paid] so far. The premium of [outstanding_amount] due on [premium_due_date] is pending, and your policy is in 'Discontinuance' status with no life insurance cover. Could you tell me why you haven't been able to pay the premium?",
    keywords: ["policy confirmation", "discontinuance", "premium due", "outstanding amount"],
    priority: 5,
    isActive: true
  },
  {
    category: "Conversation Flow",
    question: "How to handle customer who is busy?",
    answer: "It will take just 2 minutes of your time. Can we discuss it right now or should I reschedule your call at a better time? When would be convenient to call you again? Please can you give a time and date?",
    keywords: ["busy customer", "reschedule", "call back", "convenient time"],
    priority: 4,
    isActive: true
  },
  {
    category: "Conversation Flow",
    question: "How to handle missing policy bond?",
    answer: "You can download the policy bond through whatsapp. Please send a message from your registered mobile number on 8806727272 and you will be able to download the policy bond.",
    keywords: ["policy bond", "download", "whatsapp", "8806727272"],
    priority: 4,
    isActive: true
  },
  {
    category: "Conversation Flow", 
    question: "How to close the conversation?",
    answer: "For any further assistance with your policy, feel free to call our helpline at 1800 209 7272, message us on whatsapp on 8806 727272, mail us or visit our website. Thank you for your valuable time. Have a great day ahead.",
    keywords: ["closing", "helpline", "1800 209 7272", "whatsapp", "8806 727272"],
    priority: 4,
    isActive: true
  },
  // ValuEnable Specific Policy Information
  {
    category: "Policy Details",
    question: "What are the current policy details?",
    answer: "Premium Amount: ₹100,000 yearly, Sum Assured: ₹10,00,000, Policy Term: 10 years, Premium Payment Term: 7 years, Due Date: 25th September 2024, Fund Value: ₹5,53,089, Premium paid till date: ₹4,00,000",
    keywords: ["policy details", "premium amount", "sum assured", "policy term", "fund value"],
    priority: 5,
    isActive: true
  },
  {
    category: "Returns & Performance",
    question: "What are the effective returns and charges?",
    answer: "Effective Returns: 11.47%, Charges: 3.89%, Loyalty Benefits: ₹22,000 approximately. Fund allocations: Pure Stock Fund 35% (16.91% returns), Bluechip Equity Fund 35% (17.23% returns), Pure Stock Fund 2 30% (16.66% returns)",
    keywords: ["returns", "charges", "performance", "fund allocation", "loyalty benefits"],
    priority: 5,
    isActive: true
  },
  {
    category: "Payment Options",
    question: "What payment options are available?",
    answer: "You can pay via online transfer, credit card, debit card, net banking, PhonePe, WhatsApp Pay, Google Pay, cheque, or cash. For online payments, visit our website or we can send you a payment link.",
    keywords: ["payment", "online", "credit card", "net banking", "payment link"],
    priority: 4,
    isActive: true
  },
  {
    category: "Premium Revival",
    question: "What happens if I don't pay my premium?",
    answer: "Your policy is currently in 'Discontinuance' status with no life insurance cover. You're losing the benefit of ₹10,00,000 sum assured. Renewal premiums have maximum allocation and provide tax benefits under Section 80C and 10(10D).",
    keywords: ["discontinuance", "premium due", "life cover", "tax benefits"],
    priority: 5,
    isActive: true
  },
  {
    category: "Financial Difficulties",
    question: "What if I can't pay due to financial problems?",
    answer: "You can pay via credit card, switch to monthly EMI, or change payment frequency. After 5 years, partial withdrawal is available. Staying invested is key to achieving financial goals.",
    keywords: ["financial problems", "credit card", "EMI", "partial withdrawal"],
    priority: 4,
    isActive: true
  },
  {
    category: "Market Concerns",
    question: "Markets are too high, should I wait?",
    answer: "Your life insurance worth ₹10,00,000 has been reduced to NIL while waiting. You can invest in our Bond Fund (5.45% returns) or use Auto-transfer Portfolio strategy to systematically move from debt to equity funds when markets improve.",
    keywords: ["market high", "bond fund", "auto-transfer", "debt funds"],
    priority: 4,
    isActive: true
  },
  {
    category: "Policy Misconceptions",
    question: "I thought this was a single premium plan?",
    answer: "Your policy has PPT (Premium Payment Term) of 7 years as mentioned in policy document. By discontinuing, your money will be invested in low yield Discontinued Life Fund (4.30% returns) vs market linked funds (16.91% returns in Pure Stock Fund).",
    keywords: ["single premium", "PPT", "discontinued fund", "market linked"],
    priority: 4,
    isActive: true
  },
  {
    category: "Alternative Investments",
    question: "What about mutual funds or other alternatives?",
    answer: "Most mutual funds have 2% expense ratios without life insurance cover. Your policy's effective charges reduce to 1.61% for remaining term. You get loyalty additions of ₹22,000 which aren't available in mutual funds.",
    keywords: ["mutual funds", "expense ratio", "effective charges", "loyalty additions"],
    priority: 4,
    isActive: true
  },
  {
    category: "Unsatisfactory Returns",
    question: "What if I'm not satisfied with returns?",
    answer: "You've earned 11.47% annualized effective returns post all charges and taxes. Effective charges reduce to 1.61% for remaining term vs 3.89% till date. You can switch to any other funds based on risk appetite.",
    keywords: ["unsatisfactory returns", "fund switching", "effective charges", "risk appetite"],
    priority: 4,
    isActive: true
  },
  {
    category: "New Policy Purchase",
    question: "Should I buy a new ULIP policy?",
    answer: "ULIPs have higher charges initially. Your current policy has only 1.61% effective charges for remaining term, much cheaper than new ULIP. For traditional plans, consider diversifying by switching part of funds to debt funds.",
    keywords: ["new policy", "ULIP charges", "traditional plans", "diversification"],
    priority: 4,
    isActive: true
  },
  {
    category: "Contact Information",
    question: "How can I contact ValuEnable for assistance?",
    answer: "Call our helpline at 1800 209 7272, message us on WhatsApp at 8806 727272, email us, or visit our website. For policy bond download, send message from registered mobile to 8806727272.",
    keywords: ["contact", "helpline", "whatsapp", "policy bond", "website"],
    priority: 3,
    isActive: true
  },
  {
    category: "Growth Scenarios",
    question: "What are the growth projections?",
    answer: "Growth @ 8%: ₹11,84,000 (7.73% effective returns). Growth @ 4%: ₹9,72,576 (4.78% effective returns). Historical Growth @ 17.33%: ₹19,99,690 (15.60% effective returns). Pay 1 premium and stay scenarios also available.",
    keywords: ["growth projections", "maturity amount", "historical returns", "effective returns"],
    priority: 3,
    isActive: true
  },
  // Original insurance knowledge base entries
  {
    category: "Life Insurance",
    question: "What is life insurance?",
    answer: "Life insurance is a contract between you and an insurance company where you pay premiums in exchange for a death benefit paid to your beneficiaries when you pass away.",
    keywords: ["life insurance", "death benefit", "premiums", "beneficiaries"],
    priority: 1,
    isActive: true
  },
  {
    category: "Life Insurance",
    question: "What is life insurance?",
    answer: "Life insurance is a contract between you and an insurance company where you pay premiums in exchange for a death benefit paid to your beneficiaries when you pass away. It provides financial protection for your loved ones.",
    keywords: ["life insurance", "death benefit", "premiums", "beneficiaries", "financial protection"],
    priority: 1,
    isActive: true
  },
  {
    category: "Life Insurance",
    question: "How are life insurance premiums calculated?",
    answer: "Life insurance premiums are calculated based on several key factors: your age, health condition, lifestyle habits (smoking, drinking), coverage amount, policy type, and gender. Generally, younger and healthier individuals pay lower premiums.",
    keywords: ["premiums", "calculation", "age", "health", "lifestyle", "coverage", "smoking"],
    priority: 1,
    isActive: true
  },
  {
    category: "Life Insurance",
    question: "What are the benefits of term life insurance?",
    answer: "Term life insurance offers several key benefits: 1) Lower premiums compared to whole life insurance, 2) High coverage amounts for affordable rates, 3) Flexibility to choose coverage period, 4) No medical exam for younger applicants, and 5) Tax-free death benefit for beneficiaries. It's ideal for income replacement and debt protection.",
    keywords: ["term life", "benefits", "affordable", "coverage", "income replacement", "debt protection"],
    priority: 1,
    isActive: true
  },
  {
    category: "Claims",
    question: "How do I file a life insurance claim?",
    answer: "To file a life insurance claim: 1) Contact the insurance company immediately, 2) Obtain and provide the death certificate, 3) Complete all required claim forms, 4) Submit supporting documentation, 5) Wait for processing (usually 30-60 days). Keep copies of all documents.",
    keywords: ["claims", "file claim", "death certificate", "documentation", "processing time"],
    priority: 1,
    isActive: true
  },
  {
    category: "Claims",
    question: "What documents are needed for a life insurance claim?",
    answer: "Required documents typically include: certified death certificate, completed claim forms, policy documents, proof of identity of the beneficiary, and any additional forms requested by the insurer. Some cases may require medical records or police reports.",
    keywords: ["documents", "death certificate", "claim forms", "policy documents", "beneficiary", "medical records"],
    priority: 1,
    isActive: true
  },
  {
    category: "Policy Types",
    question: "What are the different types of life insurance?",
    answer: "Main types include: Term Life (temporary coverage at lower cost), Whole Life (permanent with cash value), Universal Life (flexible premiums and benefits), and Variable Life (investment component). Each serves different financial needs and goals.",
    keywords: ["policy types", "term life", "whole life", "universal life", "variable life", "permanent", "temporary"],
    priority: 1,
    isActive: true
  },
  {
    category: "Policy Types",
    question: "What is whole life insurance?",
    answer: "Whole life insurance is permanent life insurance that provides lifelong coverage with level premiums. It builds cash value that you can borrow against, and the death benefit is guaranteed. Premiums are higher than term life but remain constant throughout your life.",
    keywords: ["whole life", "permanent", "cash value", "level premiums", "guaranteed", "lifelong coverage"],
    priority: 1,
    isActive: true
  },
  {
    category: "Coverage",
    question: "How much life insurance coverage do I need?",
    answer: "A general rule is 10-12 times your annual income. Consider your debts, family expenses, children's education costs, mortgage, and your spouse's income when determining coverage amount. Online calculators can help determine your specific needs.",
    keywords: ["coverage amount", "annual income", "debts", "family expenses", "education costs", "mortgage", "calculator"],
    priority: 1,
    isActive: true
  },
  {
    category: "Coverage",
    question: "Can I change my life insurance coverage?",
    answer: "Yes, you can typically increase or decrease coverage, though changes may require medical underwriting. You can also add riders for additional benefits. Contact your insurer to discuss options and any associated costs or requirements.",
    keywords: ["change coverage", "increase", "decrease", "medical underwriting", "riders", "additional benefits"],
    priority: 1,
    isActive: true
  },
  {
    category: "Health Insurance",
    question: "What is health insurance?",
    answer: "Health insurance is coverage that pays for medical and surgical expenses. It can either reimburse you for expenses or pay the care provider directly. It helps protect you from high medical costs and provides access to preventive care.",
    keywords: ["health insurance", "medical expenses", "surgical expenses", "preventive care", "coverage"],
    priority: 1,
    isActive: true
  },
  {
    category: "Health Insurance",
    question: "What does health insurance typically cover?",
    answer: "Health insurance typically covers: doctor visits, hospital stays, prescription medications, preventive services, emergency care, and specialty treatments. Coverage varies by plan, so check your policy details for specific benefits and limitations.",
    keywords: ["health coverage", "doctor visits", "hospital", "prescription", "preventive services", "emergency care"],
    priority: 1,
    isActive: true
  },
  {
    category: "Premiums",
    question: "How can I lower my insurance premiums?",
    answer: "Ways to lower premiums include: maintaining good health, choosing higher deductibles, bundling policies, taking advantage of discounts, paying annually instead of monthly, and regularly reviewing your coverage needs. Quitting smoking can significantly reduce life insurance premiums.",
    keywords: ["lower premiums", "good health", "higher deductibles", "bundling", "discounts", "quit smoking"],
    priority: 1,
    isActive: true
  },
  {
    category: "Premiums",
    question: "Why did my insurance premium increase?",
    answer: "Premium increases can occur due to: age-related rate adjustments, changes in health status, increased coverage, inflation, changes in risk factors, or overall market conditions. Review your policy and contact your insurer for specific reasons.",
    keywords: ["premium increase", "age", "health status", "coverage changes", "inflation", "risk factors"],
    priority: 1,
    isActive: true
  }
];
