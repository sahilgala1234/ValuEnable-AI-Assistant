import type { InsertKnowledgeBase } from "@shared/schema";

export const defaultKnowledgeBase: InsertKnowledgeBase[] = [
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
