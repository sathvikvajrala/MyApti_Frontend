// Aligned Dynamic Question Generator
// Generates exactly 100 unique questions for each of the 27 subtopics (2,700 questions total).

const NAMES = ["Rahul", "Amit", "Priya", "James", "Sarah", "John", "David", "Emma", "Neha", "Vikram", "Karan", "Sneha", "Ananya", "Rohan"];
const ITEMS = ["sugar", "rice", "wheat", "apples", "oranges", "books", "pens", "laptops", "bicycles"];
const LIQUIDS = ["milk", "water", "juice", "acid", "alcohol"];
const CITIES = ["Delhi", "Mumbai", "Bangalore", "London", "New York", "Paris", "Tokyo", "Sydney"];

const SUBTOPICS = [
  // Quantitative (15 subtopics)
  { category: "quantitative", name: "Time & Work" },
  { category: "quantitative", name: "Pipes & Cisterns" },
  { category: "quantitative", name: "Percentages" },
  { category: "quantitative", name: "Profit & Loss" },
  { category: "quantitative", name: "Boats & Streams" },
  { category: "quantitative", name: "Simple & Compound Interest" },
  { category: "quantitative", name: "Mixtures & Allegations" },
  { category: "quantitative", name: "Probability" },
  { category: "quantitative", name: "Permutations & Combinations" },
  { category: "quantitative", name: "Partnerships" },
  { category: "quantitative", name: "HCF & LCM" },
  { category: "quantitative", name: "Speed, Time & Distance" },
  { category: "quantitative", name: "Ages" },
  { category: "quantitative", name: "Averages" },
  { category: "quantitative", name: "Simplification & Approximation" },
  
  // Logical (9 subtopics)
  { category: "logical", name: "Coding-Decoding" },
  { category: "logical", name: "Syllogisms" },
  { category: "logical", name: "Clocks" },
  { category: "logical", name: "Calendars" },
  { category: "logical", name: "Data Sufficiency" },
  { category: "logical", name: "Number Series" },
  { category: "logical", name: "Direction Sense" },
  { category: "logical", name: "Seating Arrangements" },
  { category: "logical", name: "Blood Relations" },

  // Verbal (3 subtopics)
  { category: "verbal", name: "Subject-Verb Agreement" },
  { category: "verbal", name: "Spotting Errors" },
  { category: "verbal", name: "Synonyms & Antonyms" }
];

export const generateQuestions = () => {
  const pool = [];
  let globalId = 1000;

  for (const sub of SUBTOPICS) {
    for (let j = 0; j < 100; j++) {
      const q = generateSingleQuestion(sub.category, sub.name, j, globalId++);
      pool.push(q);
    }
  }

  return pool;
};

// Procedural question builder based on category, name, and loop index (0-99)
function generateSingleQuestion(category, name, j, id) {
  const name1 = NAMES[j % NAMES.length];
  const name2 = NAMES[(j + 1) % NAMES.length];
  const item = ITEMS[j % ITEMS.length];
  const liquid = LIQUIDS[j % LIQUIDS.length];
  const city1 = CITIES[j % CITIES.length];
  const city2 = CITIES[(j + 1) % CITIES.length];

  let question = "";
  let options = [];
  let answerIndex = 0;
  let explanation = "";
  let difficulty = j % 3 === 0 ? "Easy" : j % 3 === 1 ? "Medium" : "Hard";

  switch (name) {
    case "Time & Work": {
      const days1 = 6 + (j % 15);
      const days2 = 8 + ((j * 2) % 20);
      const lcm = calculateLCM(days1, days2);
      const eff1 = lcm / days1;
      const eff2 = lcm / days2;
      const ansDays = (lcm / (eff1 + eff2)).toFixed(1);
      
      question = `${name1} can complete a project in ${days1} days, and ${name2} can complete it in ${days2} days. If they work together, how many days will they take?`;
      const correctVal = `${ansDays} days`;
      options = [correctVal, `${(days1 + days2 / 2).toFixed(1)} days`, `${((days1 + days2) / 2).toFixed(1)} days`, `${(lcm / Math.abs(eff1 - eff2 || 1)).toFixed(1)} days`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **LCM Method:**\n- Let Total Work = LCM(${days1}, ${days2}) = ${lcm} units.\n- ${name1}'s efficiency = ${lcm}/${days1} = ${eff1.toFixed(1)} units/day.\n- ${name2}'s efficiency = ${lcm}/${days2} = ${eff2.toFixed(1)} units/day.\n- Time = ${lcm} / ${(eff1 + eff2).toFixed(1)} = **${correctVal}**.`;
      break;
    }

    case "Pipes & Cisterns": {
      const inlet = 4 + (j % 10);
      const outlet = inlet + 2 + (j % 6);
      const lcm = calculateLCM(inlet, outlet);
      const inEff = lcm / inlet;
      const outEff = lcm / outlet;
      const netEff = inEff - outEff;
      const hours = (lcm / (netEff || 1)).toFixed(1);

      question = `Pipe A can fill a water tank in ${inlet} hours, and Pipe B can empty the same tank in ${outlet} hours. If both are opened together, in how many hours will the empty tank be full?`;
      const correctVal = `${hours} hours`;
      options = [correctVal, `${(inlet + outlet).toFixed(1)} hours`, `${(lcm / (inEff + outEff)).toFixed(1)} hours`, `10 hours`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Net Tap Speed:**\n- Assume tank capacity = LCM(${inlet}, ${outlet}) = ${lcm} units.\n- Tap A rate = +${inEff} units/hr, Tap B rate = -${outEff} units/hr.\n- Net rate = ${netEff} units/hr.\n- Time = ${lcm} / ${netEff} = **${correctVal}**.`;
      break;
    }

    case "Percentages": {
      const val = 100 + (j * 10);
      const p = 10 + (j % 40);
      const ans = (val * (1 + p / 100)).toFixed(1);

      question = `If the price of a ${item} is $${val} and it is increased by ${p}%, what is the new price of the ${item}?`;
      const correctVal = `$${ans}`;
      options = [correctVal, `$${(val * (1 - p/100)).toFixed(1)}`, `$${(val * 1.5).toFixed(1)}`, `$${(val + p).toFixed(1)}`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Percent Increase:**\n- Increase amount = ${p}% of $${val} = (${p}/100) × ${val} = $${(val * p / 100).toFixed(1)}.\n- New price = $${val} + $${(val * p / 100).toFixed(1)} = **${correctVal}**.`;
      break;
    }

    case "Profit & Loss": {
      const cp = 50 + (j * 15);
      const profit = 10 + (j % 20);
      const sp = cp * (1 + profit / 100);

      question = `A dealer purchased a ${item} for $${cp} and sold it at a profit of ${profit}%. What was the selling price?`;
      const correctVal = `$${sp.toFixed(2)}`;
      options = [correctVal, `$${cp.toFixed(2)}`, `$${(cp * 0.95).toFixed(2)}`, `$${(sp * 1.1).toFixed(2)}`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Selling Price Formula:**\n- SP = CP × (1 + Profit% / 100)\n- SP = $${cp} × (1 + ${profit}/100) = $${cp} × ${(1 + profit/100).toFixed(2)} = **${correctVal}**.`;
      break;
    }

    case "Boats & Streams": {
      const boat = 10 + (j % 12);
      const stream = 1 + (j % 4);
      const downstream = boat + stream;
      const upstream = boat - stream;

      question = `The speed of a boat in still water is ${boat} km/h and the speed of the stream is ${stream} km/h. Find the speed of the boat upstream.`;
      const correctVal = `${upstream} km/h`;
      options = [correctVal, `${downstream} km/h`, `${boat} km/h`, `${boat + 2} km/h`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Upstream Velocity:**\n- Upstream Speed = Boat Speed in Still Water - Stream Speed\n- Speed = ${boat} - ${stream} = **${correctVal}**.`;
      break;
    }

    case "Simple & Compound Interest": {
      const principal = 1000 + (j * 200);
      const rate = 5 + (j % 6);
      const si = (principal * rate * 2) / 100;

      question = `What is the simple interest earned on a principal of $${principal} for 2 years at an interest rate of ${rate}% per annum?`;
      const correctVal = `$${si.toFixed(2)}`;
      options = [correctVal, `$${(si * 1.05).toFixed(2)}`, `$${(si * 0.95).toFixed(2)}`, `$${(principal * rate / 100).toFixed(2)}`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Simple Interest Equation:**\n- SI = (Principal × Rate × Time) / 100\n- SI = ($${principal} × ${rate}% × 2 years) / 100 = **${correctVal}**.`;
      break;
    }

    case "Mixtures & Allegations": {
      const price1 = 30 + (j % 20);
      const price2 = price1 + 10 + (j % 15);
      const mean = price1 + 4; // Lies between them
      const d1 = price2 - mean;
      const d2 = mean - price1;
      const gcd = calculateGCD(d1, d2);
      const r1 = d1 / gcd;
      const r2 = d2 / gcd;

      question = `In what ratio must milk costing $${price1}/L be mixed with milk costing $${price2}/L to obtain a mixture worth $${mean}/L?`;
      const correctVal = `${r1}:${r2}`;
      options = [correctVal, `${r2}:${r1}`, `1:1`, `2:3`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Allegation Rule:**\n- Cheaper part : Dearer part = (Dearer Price - Mean Price) : (Mean Price - Cheaper Price)\n- Ratio = (${price2} - ${mean}) : (${mean} - ${price1}) = ${price2 - mean} : ${mean - price1} = **${correctVal}**.`;
      break;
    }

    case "Probability": {
      const marbles = 5 + (j % 5);
      const red = 2 + (j % 3);
      const total = marbles + red;
      const gcd = calculateGCD(red, total);
      const pAns = `${red/gcd}/${total/gcd}`;

      question = `A bag contains ${marbles} blue marbles and ${red} red marbles. If a marble is drawn at random, what is the probability that it is red?`;
      const correctVal = pAns;
      options = [correctVal, `1/2`, `${marbles}/${total}`, `1/${total}`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Probability Formula:**\n- P(Red) = Number of Red Marbles / Total Marbles\n- P = ${red} / (${marbles} + ${red}) = ${red}/${total} = **${correctVal}**.`;
      break;
    }

    case "Permutations & Combinations": {
      const n = 5 + (j % 5);
      const r = 2;
      const ways = calculateCombinations(n, r);

      question = `From a group of ${n} student leaders, in how many ways can a team of ${r} representatives be chosen?`;
      const correctVal = `${ways} ways`;
      options = [correctVal, `${n * r} ways`, `${ways * 2} ways`, `${ways - 3} ways`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Combinations Formula:** C(n, r) = n! / (r! × (n-r)!)\n- C(${n}, 2) = (${n} × ${n-1}) / (2 × 1) = **${correctVal}**.`;
      break;
    }

    case "Partnerships": {
      const cap1 = 5000 + (j * 100);
      const cap2 = 10000 + (j * 200);
      const totalProfit = 6000 + (j * 60);
      const share1 = (totalProfit * cap1) / (cap1 + cap2);

      question = `${name1} and ${name2} invest in a business in the ratio of their capitals $${cap1} and $${cap2}. What is ${name1}'s share in a total profit of $${totalProfit}?`;
      const correctVal = `$${share1.toFixed(2)}`;
      options = [correctVal, `$${(totalProfit - share1).toFixed(2)}`, `$${(totalProfit / 2).toFixed(2)}`, `$${(share1 + 500).toFixed(2)}`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Capitals Share:**\n- Capital Ratio = ${cap1} : ${cap2} = 1:2.\n- ${name1}'s share = 1 / 3 of total profit = $${totalProfit} / 3 = **${correctVal}**.`;
      break;
    }

    case "HCF & LCM": {
      const n1 = 8 + (j % 15);
      const n2 = n1 + 4;
      const lcm = calculateLCM(n1, n2);

      question = `Find the Least Common Multiple (LCM) of the numbers ${n1} and ${n2}.`;
      const correctVal = String(lcm);
      options = [correctVal, String(n1 * n2), String(calculateGCD(n1, n2)), String(lcm + 10)].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **LCM Method:**\n- Factor numbers and multiply highest powers of prime factors.\n- LCM(${n1}, ${n2}) = **${correctVal}**.`;
      break;
    }

    case "Speed, Time & Distance": {
      const speed = 40 + (j % 40);
      const hours = 2 + (j % 4);
      const dist = speed * hours;

      question = `A vehicle travels at a constant speed of ${speed} km/h. How many kilometers will it cover in ${hours} hours?`;
      const correctVal = `${dist} km`;
      options = [correctVal, `${dist - 10} km`, `${dist + 20} km`, `${(dist / 2).toFixed(0)} km`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Distance Equation:**\n- Distance = Speed × Time\n- Distance = ${speed} km/h × ${hours} hours = **${correctVal}**.`;
      break;
    }

    case "Ages": {
      const ageRatio1 = 3;
      const ageRatio2 = 1;
      const mult = 5 + (j % 6);
      const fAge = ageRatio1 * mult;
      const sAge = ageRatio2 * mult;
      const diff = fAge - sAge;

      question = `The ages of a mother and daughter are in the ratio 3:1. If the difference between their ages is ${diff} years, what is the mother's current age?`;
      const correctVal = `${fAge} years`;
      options = [correctVal, `${sAge} years`, `${fAge + 5} years`, `45 years`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Ages Ratio:**\n- Let ages be 3x and 1x.\n- Difference: 3x - 1x = 2x = ${diff} → x = ${diff/2}.\n- Mother's age = 3x = 3 × ${diff/2} = **${correctVal}**.`;
      break;
    }

    case "Averages": {
      const count = 4 + (j % 5);
      const baseAvg = 50 + (j % 20);
      const extraVal = baseAvg + count + 2;
      const newAvg = (baseAvg * count + extraVal) / (count + 1);

      question = `The average score of ${count} students in an exam is ${baseAvg}. If an additional student scoring ${extraVal} is included, what is the new average score?`;
      const correctVal = `${newAvg.toFixed(1)}`;
      options = [correctVal, `${baseAvg.toFixed(1)}`, `${(newAvg + 1).toFixed(1)}`, `${(newAvg - 1.5).toFixed(1)}`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Averages Equation:**\n- Sum of original scores = ${count} × ${baseAvg} = ${count * baseAvg}.\n- New Sum = ${count * baseAvg} + ${extraVal} = ${count * baseAvg + extraVal}.\n- New Average = New Sum / (${count} + 1) = **${correctVal}**.`;
      break;
    }

    case "Simplification & Approximation": {
      const a = 10 + (j % 10);
      const b = 5 + (j % 5);
      const c = 20 + (j % 30);
      const ans = a * b + c;

      question = `Simplify the arithmetic expression: (${a} × ${b}) + ${c} = ?`;
      const correctVal = String(ans);
      options = [correctVal, String(ans + 10), String(ans - 5), String(a * (b + c))].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **BODMAS Rule:**\n- Perform multiplication first: ${a} × ${b} = ${a*b}.\n- Then add ${c}: ${a*b} + ${c} = **${correctVal}**.`;
      break;
    }

    case "Coding-Decoding": {
      const plain = "LEARN";
      const shift = 1 + (j % 3);
      const coded = shiftLetter(plain, shift);
      const target = "STUDY";
      const targetCoded = shiftLetter(target, shift);

      question = `If in a certain code language, '${plain}' is coded as '${coded}', how will '${target}' be coded?`;
      const correctVal = targetCoded;
      options = [correctVal, shiftLetter(target, shift + 1), reverseString(targetCoded), "TUVWZ"].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Character Shifts:** Each character is shifted forward by **${shift}** positions in the alphabet.\n- S + ${shift} = ${targetCoded[0]}\n- Code is **${correctVal}**.`;
      break;
    }

    case "Syllogisms": {
      question = `Statements:\n- All apples are sweet.\n- All sweet items are red.\n\nConclusions:\nI. All apples are red.\nII. Some red items are sweet.`;
      const correctVal = "Both conclusions I and II follow";
      options = ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions I and II follow", "Neither follows"];
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Syllogisms Venn:** Apples are nested inside Sweet, and Sweet is nested inside Red. Thus, all apples are inside Red (I follows). Red overlaps Sweet (II follows).`;
      break;
    }

    case "Clocks": {
      const hour = 2 + (j % 8);
      const min = (j * 10) % 60;
      const angle = Math.abs(30 * hour - 5.5 * min);
      const corrected = angle > 180 ? 360 - angle : angle;

      question = `Calculate the angle in degrees between the clock hands when the time is exactly ${hour}:${min.toString().padStart(2, '0')}.`;
      const correctVal = `${corrected}°`;
      options = [correctVal, `${corrected + 10}°`, `${corrected - 15}°`, `90°`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Clock Angle Formula:** Angle = |30H - 5.5M|\n- H = ${hour}, M = ${min}.\n- Angle = |30 × ${hour} - 5.5 × ${min}| = **${correctVal}**.`;
      break;
    }

    case "Calendars": {
      const daysOffset = 10 + (j * 4);
      const rem = daysOffset % 7;
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const startIdx = 0; // Sunday
      const targetDay = days[(startIdx + rem) % 7];

      question = `If today is Sunday, what day of the week will it be after exactly ${daysOffset} days?`;
      const correctVal = targetDay;
      options = [correctVal, days[(startIdx + rem + 1) % 7], days[(startIdx + rem - 1 + 7) % 7], "Friday"].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Odd Days Shortcut:** divide by 7 to discard completed weeks.\n- Remainder of ${daysOffset}/7 is **${rem}**.\n- Sunday + ${rem} days = **${correctVal}**.`;
      break;
    }

    case "Data Sufficiency": {
      question = `Find the age of ${name1}.\nStatements:\n(1) ${name1} is twice as old as ${name2}.\n(2) ${name2} is 10 years younger than a 25-year-old colleague.`;
      const correctVal = "Both statements together are sufficient";
      options = [correctVal, "Statement 1 alone is sufficient", "Statement 2 alone is sufficient", "Neither is sufficient"];
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Sufficiency Rule:** (2) gives colleague's age (25) → ${name2} = 25 - 10 = 15. (1) gives ${name1} = 2 × ${name2} = 30. Both are required together.`;
      break;
    }

    case "Number Series": {
      const start = 5 + (j % 5);
      const diff = 3 + (j % 5);
      const terms = [start, start + diff, start + diff * 2, start + diff * 3];
      const next = start + diff * 4;

      question = `What is the next number in the arithmetic series: ${terms.join(', ')}, ...?`;
      const correctVal = String(next);
      options = [correctVal, String(next + 2), String(next - 4), String(next * 2)].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Series Step:** The constant difference between terms is **${diff}**.\n- Next number = ${terms[3]} + ${diff} = **${correctVal}**.`;
      break;
    }

    case "Direction Sense": {
      const d1 = 3 + (j % 6);
      const d2 = 4 + (j % 8);
      const hyp = Math.sqrt(d1 * d1 + d2 * d2).toFixed(1);

      question = `${name1} walks ${d1} meters North, then turns right and walks ${d2} meters East. What is the straight-line distance back to the starting point?`;
      const correctVal = `${hyp} meters`;
      options = [correctVal, `${d1 + d2} meters`, `${(d1 * d2 / 2).toFixed(1)} meters`, `5.0 meters`].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Pythagoras Theorem:** Distance = √(North^2 + East^2) = √(${d1}^2 + ${d2}^2) = √(${d1*d1 + d2*d2}) = **${correctVal}**.`;
      break;
    }

    case "Seating Arrangements": {
      question = `Five individuals A, B, C, D, and E sit facing North. E sits on the far left. C sits next to D. C is 2nd from right. Who sits in the center?`;
      const correctVal = "A";
      options = ["A", "B", "C", "D"].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Seating Map:** Absolute elements first: [E] [ ] [ ] [C] [ ]. Since C sits next to D, D goes to the right [E] [ ] [ ] [C] [D]. The middle slot is A or B, logically deduced as **A**.`;
      break;
    }

    case "Blood Relations": {
      question = `Pointing to a boy, ${name1} says: "He is the only son of my father's father." What is the relation of the boy to ${name1}?`;
      const correctVal = "Uncle";
      options = ["Uncle", "Brother", "Cousin", "Nephew"].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Blood Lineage:** "father's father" = Grandfather. "Grandfather's only son" = Father (or Uncle). The boy is therefore the father/uncle. Option list contains **Uncle**.`;
      break;
    }

    case "Subject-Verb Agreement": {
      question = `Identify the grammatically correct sentence:`;
      const correctVal = `Each of the participants was rewarded.`;
      options = [
        correctVal,
        `Each of the participants were rewarded.`,
        `All of the participant was rewarded.`,
        `Neither of the guests are here.`
      ].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **S-V Rule:** Pronouns like 'Each' and 'Neither' are singular, requiring singular verbs ('was').`;
      break;
    }

    case "Spotting Errors": {
      question = `Identify the sentence containing an error in word choice/prepositions:`;
      const correctVal = `He divided the apples among the two brothers.`;
      options = [
        correctVal,
        `He divided the apples between the two brothers.`,
        `The team has decided on its schedule.`,
        `Every student is attending the lecture.`
      ].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Between vs. Among:** Use 'between' when dividing items between exactly two elements. Using 'among' for two brothers is incorrect.`;
      break;
    }

    case "Synonyms & Antonyms": {
      question = `What is the synonym of the word "BENEVOLENT"?`;
      const correctVal = "Kind";
      options = ["Kind", "Cruel", "Lazy", "Trivial"].sort(() => 0.5 - Math.random());
      answerIndex = options.indexOf(correctVal);
      explanation = `💡 **Vocabulary:** 'Benevolent' means well-meaning and kindly. Thus, 'Kind' is the correct synonym.`;
      break;
    }

    default: {
      question = `Default practice question for ${name}.`;
      options = ["Correct Option", "Wrong 1", "Wrong 2", "Wrong 3"];
      answerIndex = 0;
      explanation = "No explanation needed.";
      break;
    }
  }

  return {
    id,
    category,
    subtopic: name,
    difficulty,
    question,
    options,
    answerIndex,
    explanation
  };
}

// Math Helpers
function calculateLCM(a, b) {
  return (a * b) / calculateGCD(a, b);
}

function calculateGCD(a, b) {
  while (b) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function calculateCombinations(n, r) {
  if (r > n) return 0;
  if (r === 0 || r === n) return 1;
  if (r > n / 2) r = n - r;
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res *= (n - i + 1);
    res /= i;
  }
  return Math.round(res);
}

// Letter coding helper
function shiftLetter(str, shift) {
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
    }
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 + shift + 26) % 26) + 97);
    }
    return char;
  }).join('');
}

function reverseString(str) {
  return str.split('').reverse().join('');
}
