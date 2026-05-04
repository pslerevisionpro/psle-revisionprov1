export const mathsQuestions = [
  {
    id: 1,
    question: "What is 3/4 expressed as a decimal?",
    options: ["0.25", "0.50", "0.75", "1.25"],
    correct: 2,
    explanation: "To convert a fraction to a decimal, divide the numerator by the denominator. 3 ÷ 4 = 0.75. Remember: 1/4 = 0.25, 1/2 = 0.50, 3/4 = 0.75."
  },
  {
    id: 2,
    question: "A rectangle has a length of 12 cm and a width of 5 cm. What is its area?",
    options: ["34 cm²", "60 cm²", "17 cm²", "70 cm²"],
    correct: 1,
    explanation: "Area of a rectangle = length × width. So 12 × 5 = 60 cm². The perimeter would be 2 × (12 + 5) = 34 cm — don't confuse area with perimeter."
  },
  {
    id: 3,
    question: "What is 15% of 200?",
    options: ["20", "25", "30", "35"],
    correct: 2,
    explanation: "To find 15% of 200: multiply 200 × 15 ÷ 100 = 30. Or think of it as 10% of 200 = 20, plus 5% of 200 = 10, giving 20 + 10 = 30."
  },
  {
    id: 4,
    question: "What is the value of 2³?",
    options: ["6", "8", "9", "12"],
    correct: 1,
    explanation: "2³ means 2 × 2 × 2 = 8. The small number (exponent) tells you how many times to multiply the base number by itself."
  },
  {
    id: 5,
    question: "Simplify the fraction 18/24.",
    options: ["3/4", "2/3", "6/8", "9/12"],
    correct: 0,
    explanation: "Find the highest common factor (HCF) of 18 and 24, which is 6. Divide both by 6: 18 ÷ 6 = 3, 24 ÷ 6 = 4. So 18/24 = 3/4 in its simplest form."
  },
  {
    id: 6,
    question: "A bag contains 5 red balls and 3 blue balls. What is the probability of picking a red ball?",
    options: ["3/8", "5/3", "5/8", "1/2"],
    correct: 2,
    explanation: "Probability = favourable outcomes ÷ total outcomes. There are 5 red balls out of 8 total (5 + 3). So probability = 5/8."
  },
  {
    id: 7,
    question: "What is the next number in the sequence: 2, 5, 10, 17, ___?",
    options: ["24", "25", "26", "28"],
    correct: 2,
    explanation: "The differences between terms are: +3, +5, +7 — odd numbers increasing by 2. The next difference should be +9, so 17 + 9 = 26."
  },
  {
    id: 8,
    question: "If a train travels at 80 km/h, how far will it travel in 2.5 hours?",
    options: ["160 km", "180 km", "200 km", "220 km"],
    correct: 2,
    explanation: "Distance = Speed × Time. So 80 × 2.5 = 200 km. You can also calculate: 80 × 2 = 160, plus 80 × 0.5 = 40, giving 160 + 40 = 200 km."
  },
  {
    id: 9,
    question: "What is the perimeter of a square with a side of 7 cm?",
    options: ["14 cm", "21 cm", "28 cm", "49 cm"],
    correct: 2,
    explanation: "A square has 4 equal sides. Perimeter = 4 × side length = 4 × 7 = 28 cm. Note: the area would be 7 × 7 = 49 cm²."
  },
  {
    id: 10,
    question: "Solve for x: 3x + 7 = 22",
    options: ["x = 3", "x = 4", "x = 5", "x = 6"],
    correct: 2,
    explanation: "Subtract 7 from both sides: 3x = 22 - 7 = 15. Then divide both sides by 3: x = 15 ÷ 3 = 5. Check: 3(5) + 7 = 15 + 7 = 22 ✓"
  },
]
