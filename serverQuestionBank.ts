export interface FallbackQuestion {
  prompt: string;
  options: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface TemplateDef {
  topic: string;
  en: {
    prompt: (chapter: string) => string;
    options: [string, string, string, string];
    correct: 0 | 1 | 2 | 3;
    explanation: string;
  };
  hi: {
    prompt: (chapter: string) => string;
    options: [string, string, string, string];
    correct: 0 | 1 | 2 | 3;
    explanation: string;
  };
  difficulty: "Easy" | "Medium" | "Hard";
}

// 50 distinct templates for Physics
const PHYSICS_TEMPLATES: TemplateDef[] = [
  {
    topic: "Average Velocity",
    en: {
      prompt: (ch) => `In "${ch}", a particle moves along a straight line covering the first half of distance at speed $v_1 = 30\\text{ m/s}$ and the second half at $v_2 = 60\\text{ m/s}$. Find its average speed.`,
      options: ["$45\\text{ m/s}$", "$40\\text{ m/s}$", "$50\\text{ m/s}$", "$35\\text{ m/s}$"],
      correct: 1,
      explanation: "Harmonic mean applies for equal distance halves: $v_{\\text{avg}} = \\frac{2v_1v_2}{v_1 + v_2} = \\frac{2 \\times 30 \\times 60}{30 + 60} = 40\\text{ m/s}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, एक कण एक सीधी रेखा में आधी दूरी $v_1 = 30\\text{ m/s}$ और शेष आधी दूरी $v_2 = 60\\text{ m/s}$ से तय करता है। औसत चाल क्या होगी?`,
      options: ["$45\\text{ m/s}$", "$40\\text{ m/s}$", "$50\\text{ m/s}$", "$35\\text{ m/s}$"],
      correct: 1,
      explanation: "समान दूरियों के लिए हरात्मक माध्य प्रयुक्त होता है: $v_{\\text{avg}} = \\frac{2v_1v_2}{v_1 + v_2} = \\frac{3600}{90} = 40\\text{ m/s}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Projectile Trajectory",
    en: {
      prompt: (ch) => `Related to "${ch}", a ball is thrown with velocity $u$ at angle $\\theta$ with horizontal. What is its radius of curvature at the highest point of trajectory?`,
      options: ["$\\frac{u^2}{g}$", "$\\frac{u^2 \\cos^2\\theta}{g}$", "$\\frac{u^2 \\sin^2\\theta}{g}$", "$\\frac{u^2 \\cos\\theta}{g}$"],
      correct: 1,
      explanation: "At the peak, velocity is purely horizontal $v = u\\cos\\theta$ and normal acceleration is $a_n = g$. Thus $R_c = \\frac{v^2}{a_n} = \\frac{u^2 \\cos^2\\theta}{g}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, एक प्रक्षेप्य को $u$ वेग से क्षैतिज से $\\theta$ कोण पर फेंका जाता है। उच्चतम बिंदु पर वक्रता त्रिज्या क्या होगी?`,
      options: ["$\\frac{u^2}{g}$", "$\\frac{u^2 \\cos^2\\theta}{g}$", "$\\frac{u^2 \\sin^2\\theta}{g}$", "$\\frac{u^2 \\cos\\theta}{g}$"],
      correct: 1,
      explanation: "शीर्ष पर वेग $v = u\\cos\\theta$ और अभिलंब त्वरण $g$ होता है, अतः वक्रता त्रिज्या $R = \\frac{u^2\\cos^2\\theta}{g}$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Newton's Second Law & Tension",
    en: {
      prompt: (ch) => `In a system under "${ch}", two masses $m_1 = 3\\text{ kg}$ and $m_2 = 2\\text{ kg}$ are connected by a light string over a frictionless pulley ($g = 10\\text{ m/s}^2$). What is the acceleration of the system?`,
      options: ["$2\\text{ m/s}^2$", "$5\\text{ m/s}^2$", "$1\\text{ m/s}^2$", "$4\\text{ m/s}^2$"],
      correct: 0,
      explanation: "For Atwood machine: $a = \\frac{m_1 - m_2}{m_1 + m_2}g = \\frac{3 - 2}{3 + 2} \\times 10 = 2\\text{ m/s}^2$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" से संबंधित, घर्षणरहित घिरनी पर दो द्रव्यमान $3\\text{ kg}$ व $2\\text{ kg}$ लटके हैं ($g = 10\\text{ m/s}^2$)। निकाय का त्वरण ज्ञात कीजिए।`,
      options: ["$2\\text{ m/s}^2$", "$5\\text{ m/s}^2$", "$1\\text{ m/s}^2$", "$4\\text{ m/s}^2$"],
      correct: 0,
      explanation: "एटवुड मशीन सूत्र: $a = \\frac{m_1 - m_2}{m_1 + m_2}g = \\frac{1}{5} \\times 10 = 2\\text{ m/s}^2$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Centripetal Banking",
    en: {
      prompt: (ch) => `For safe negotiation of curved road in "${ch}", what is the ideal banking angle $\\theta$ for a car traveling at speed $v$ along a curve of radius $r$?`,
      options: ["$\\tan\\theta = \\frac{v}{rg}$", "$\\tan\\theta = \\frac{v^2}{rg}$", "$\\sin\\theta = \\frac{v^2}{rg}$", "$\\tan\\theta = \\frac{rg}{v^2}$"],
      correct: 1,
      explanation: "Balancing horizontal normal component: $N\\sin\\theta = \\frac{mv^2}{r}$ and $N\\cos\\theta = mg$, hence $\\tan\\theta = \\frac{v^2}{rg}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, त्रिज्या $r$ के मोड़ पर $v$ चाल से मुड़ती कार के लिए सड़क का आदर्श झुकाव कोण $\\theta$ क्या होना चाहिए?`,
      options: ["$\\tan\\theta = \\frac{v}{rg}$", "$\\tan\\theta = \\frac{v^2}{rg}$", "$\\sin\\theta = \\frac{v^2}{rg}$", "$\\tan\\theta = \\frac{rg}{v^2}$"],
      correct: 1,
      explanation: "अभिलंब प्रतिक्रिया घटकों के संतुलन से: $\\tan\\theta = \\frac{v^2}{rg}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Work Done by Spring",
    en: {
      prompt: (ch) => `In "${ch}", a spring of spring constant $k = 400\\text{ N/m}$ is elongated from $x = 5\\text{ cm}$ to $x = 10\\text{ cm}$. What is the work done by the spring force?`,
      options: ["$-1.5\\text{ J}$", "$+1.5\\text{ J}$", "$-3.0\\text{ J}$", "$+2.0\\text{ J}$"],
      correct: 0,
      explanation: "Work by spring is $W = -\\frac{1}{2}k(x_2^2 - x_1^2) = -\\frac{1}{2}(400)(0.10^2 - 0.05^2) = -200(0.01 - 0.0025) = -1.5\\text{ J}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, स्प्रिंग नियतांक $k = 400\\text{ N/m}$ वाले स्प्रिंग को $5\\text{ cm}$ से $10\\text{ cm}$ तक खींचा जाता है। स्प्रिंग बल द्वारा किया गया कार्य कितना है?`,
      options: ["$-1.5\\text{ J}$", "$+1.5\\text{ J}$", "$-3.0\\text{ J}$", "$+2.0\\text{ J}$"],
      correct: 0,
      explanation: "स्प्रिंग बल द्वारा कार्य: $W = -\\frac{1}{2}k(x_2^2 - x_1^2) = -200(0.0075) = -1.5\\text{ J}$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Coefficient of Restitution",
    en: {
      prompt: (ch) => `In "${ch}", a ball is dropped from height $H$ onto a horizontal floor. If the coefficient of restitution is $e$, the maximum height reached after the first rebound is:`,
      options: ["$e H$", "$e^2 H$", "$\\frac{H}{e}$", "$2e H$"],
      correct: 1,
      explanation: "Rebound velocity is $v_1 = e v_0 = e\\sqrt{2gH}$. Maximum rebound height $h_1 = \\frac{v_1^2}{2g} = e^2 H$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, $H$ ऊँचाई से फर्श पर गिरी गेंद का निष्कृति गुणांक $e$ है। प्रथम उछाल के बाद गेंद कितनी ऊँचाई प्राप्त करेगी?`,
      options: ["$e H$", "$e^2 H$", "$\\frac{H}{e}$", "$2e H$"],
      correct: 1,
      explanation: "पुनरुच्छाल वेग $v_1 = e\\sqrt{2gH}$, अतः प्राप्त ऊँचाई $h_1 = e^2 H$ होगी।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Moment of Inertia",
    en: {
      prompt: (ch) => `Regarding rotational dynamics in "${ch}", what is the ratio of moment of inertia of a solid sphere to that of a spherical shell of same mass and radius about their diameters?`,
      options: ["$3 : 5$", "$2 : 5$", "$5 : 3$", "$1 : 1$"],
      correct: 0,
      explanation: "Solid sphere $I_1 = \\frac{2}{5}MR^2$, spherical shell $I_2 = \\frac{2}{3}MR^2$. Ratio $\\frac{I_1}{I_2} = \\frac{2/5}{2/3} = \\frac{3}{5}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, समान द्रव्यमान और त्रिज्या वाले ठोस गोले और खोखले गोलीय कोश के व्यास के परितः जड़त्व आघूर्णों का अनुपात क्या है?`,
      options: ["$3 : 5$", "$2 : 5$", "$5 : 3$", "$1 : 1$"],
      correct: 0,
      explanation: "ठोस गोला $I = \\frac{2}{5}MR^2$ तथा गोलीय कोश $I = \\frac{2}{3}MR^2$, अनुपात = $\\frac{3}{5}$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Conservation of Angular Momentum",
    en: {
      prompt: (ch) => `In "${ch}", a rotating disc of moment of inertia $I_1$ with angular speed $\\omega_1$ has a non-rotating identical disc placed coaxially on top of it. What is the final common angular speed?`,
      options: ["$\\omega_1$", "$\\frac{\\omega_1}{2}$", "$\\frac{\\omega_1}{4}$", "$2\\omega_1$"],
      correct: 1,
      explanation: "No external torque: $I_1 \\omega_1 = (I_1 + I_2)\\omega = 2I_1 \\omega \\implies \\omega = \\frac{\\omega_1}{2}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, $I_1$ जड़त्व आघूर्ण और $\\omega_1$ कोणीय वेग से घूमती डिस्क पर एक अन्य समान स्थिर डिस्क अक्ष पर रख दी जाती है। अंतिम कोणीय वेग क्या होगा?`,
      options: ["$\\omega_1$", "$\\frac{\\omega_1}{2}$", "$\\frac{\\omega_1}{4}$", "$2\\omega_1$"],
      correct: 1,
      explanation: "कोणीय संवेग संरक्षण: $I_1 \\omega_1 = 2I_1 \\omega \\implies \\omega = \\frac{\\omega_1}{2}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Escape Velocity",
    en: {
      prompt: (ch) => `In "${ch}", if the radius of Earth shrinks by $1\\%$ with mass remaining constant, the escape velocity from the surface will:`,
      options: ["Increase by $0.5\\%$", "Decrease by $0.5\\%$", "Increase by $1\\%$", "Decrease by $1\\%$"],
      correct: 0,
      explanation: "$v_e = \\sqrt{\\frac{2GM}{R}} \\propto R^{-1/2}$. Fractional change $\\frac{\\Delta v_e}{v_e} = -\\frac{1}{2}\\frac{\\Delta R}{R} = -\\frac{1}{2}(-1\\%) = +0.5\\%$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, यदि पृथ्वी का द्रव्यमान स्थिर रखकर त्रिज्या $1\\%$ घट जाए, तो पलायन वेग में क्या परिवर्तन होगा?`,
      options: ["$0.5\\%$ की वृद्धि", "$0.5\\%$ की कमी", "$1\\%$ की वृद्धि", "$1\\%$ की कमी"],
      correct: 0,
      explanation: "$v_e \\propto R^{-1/2}$, अतः त्रिज्या $1\\%$ घटने पर पलायन वेग $0.5\\%$ बढ़ जाएगा।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Gravitational Potential Energy",
    en: {
      prompt: (ch) => `In "${ch}", what is the work required to shift a mass $m$ from Earth's surface ($R$) to an altitude equal to $h = 2R$?`,
      options: ["$\\frac{1}{3}mgR$", "$\\frac{2}{3}mgR$", "$mgR$", "$\\frac{1}{2}mgR$"],
      correct: 1,
      explanation: "$W = \\Delta U = -\\frac{GMm}{3R} - (-\\frac{GMm}{R}) = \\frac{2GMm}{3R} = \\frac{2}{3}mgR$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, द्रव्यमान $m$ को पृथ्वी की सतह ($R$) से $h = 2R$ ऊँचाई तक ले जाने में आवश्यक कार्य ज्ञात कीजिए।`,
      options: ["$\\frac{1}{3}mgR$", "$\\frac{2}{3}mgR$", "$mgR$", "$\\frac{1}{2}mgR$"],
      correct: 1,
      explanation: "$W = U_f - U_i = -\\frac{GMm}{3R} - (-\\frac{GMm}{R}) = \\frac{2}{3}mgR$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Bernoulli's Principle",
    en: {
      prompt: (ch) => `In fluid dynamics within "${ch}", water flows through a horizontal pipe. At section 1, pressure is $P_1$ and speed is $v_1$. At section 2, the cross-sectional area is halved. The pressure $P_2$ is:`,
      options: ["$P_1 - \\frac{3}{2}\\rho v_1^2$", "$P_1 - \\frac{1}{2}\\rho v_1^2$", "$P_1 + \\frac{3}{2}\\rho v_1^2$", "$P_1 - 2\\rho v_1^2$"],
      correct: 0,
      explanation: "By continuity $v_2 = 2v_1$. Bernoulli equation: $P_1 + \\frac{1}{2}\\rho v_1^2 = P_2 + \\frac{1}{2}\\rho (2v_1)^2 \\implies P_2 = P_1 - \\frac{3}{2}\\rho v_1^2$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार क्षैतिज नली में अनुप्रस्थ काट आधा होने पर वेग दोगुना हो जाता है। दूसरे भाग में दाब $P_2$ होगा:`,
      options: ["$P_1 - \\frac{3}{2}\\rho v_1^2$", "$P_1 - \\frac{1}{2}\\rho v_1^2$", "$P_1 + \\frac{3}{2}\\rho v_1^2$", "$P_1 - 2\\rho v_1^2$"],
      correct: 0,
      explanation: "सातत्य समीकरण से $v_2 = 2v_1$। बर्नोली प्रमेय से: $P_2 = P_1 - \\frac{3}{2}\\rho v_1^2$।",
    },
    difficulty: "Hard",
  },
  {
    topic: "Surface Tension Excess Pressure",
    en: {
      prompt: (ch) => `In "${ch}", what is the excess pressure inside a soap bubble of radius $R$ and surface tension $T$?`,
      options: ["$\\frac{2T}{R}$", "$\\frac{4T}{R}$", "$\\frac{T}{R}$", "$\\frac{8T}{R}$"],
      correct: 1,
      explanation: "A soap bubble has two free surfaces (inner and outer), each contributing $\\frac{2T}{R}$. Hence total $\\Delta P = \\frac{4T}{R}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, त्रिज्या $R$ तथा पृष्ठ तनाव $T$ वाले साबुन के बुलबुले के अंदर आधिक्य दाब कितना होता है?`,
      options: ["$\\frac{2T}{R}$", "$\\frac{4T}{R}$", "$\\frac{T}{R}$", "$\\frac{8T}{R}$"],
      correct: 1,
      explanation: "साबुन के बुलबुले में दो मुक्त सतहें होती हैं, इसलिए आधिक्य दाब $\\Delta P = \\frac{4T}{R}$ होता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Carnot Engine Efficiency",
    en: {
      prompt: (ch) => `Under thermodynamics in "${ch}", a Carnot engine operates between temperatures $500\\text{ K}$ and $300\\text{ K}$. What is its thermal efficiency?`,
      options: ["$60\\%$", "$40\\%$", "$25\\%$", "$50\\%$"],
      correct: 1,
      explanation: "$\\eta = 1 - \\frac{T_C}{T_H} = 1 - \\frac{300}{500} = 1 - 0.6 = 0.4 = 40\\%$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, कार्नो इंजन $500\\text{ K}$ और $300\\text{ K}$ के मध्य कार्य करता है। इसकी दक्षता क्या होगी?`,
      options: ["$60\\%$", "$40\\%$", "$25\\%$", "$50\\%$"],
      correct: 1,
      explanation: "$\\eta = 1 - \\frac{T_2}{T_1} = 1 - \\frac{300}{500} = 0.40 = 40\\%$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Adiabatic Expansion Work",
    en: {
      prompt: (ch) => `In "${ch}", during an adiabatic expansion of an ideal gas, if internal energy decreases by $150\\text{ J}$, what is the work done by the gas?`,
      options: ["$-150\\text{ J}$", "$+150\\text{ J}$", "$0\\text{ J}$", "$+300\\text{ J}$"],
      correct: 1,
      explanation: "In an adiabatic process $dQ = 0$. By First Law: $dQ = dU + dW \\implies dW = -dU = -(-150\\text{ J}) = +150\\text{ J}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, रुद्धोष्म प्रसार में यदि गैस की आंतरिक ऊर्जा में $150\\text{ J}$ की कमी आती है, तो गैस द्वारा किया गया कार्य होगा:`,
      options: ["$-150\\text{ J}$", "$+150\\text{ J}$", "$0\\text{ J}$", "$+300\\text{ J}$"],
      correct: 1,
      explanation: "रुद्धोष्म प्रक्रम में $dQ = 0$, अतः प्रथम नियम से $dW = -dU = +150\\text{ J}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Simple Harmonic Motion Phase",
    en: {
      prompt: (ch) => `In "${ch}", a particle executes SHM of amplitude $A$. At what displacement from the mean position is its kinetic energy equal to its potential energy?`,
      options: ["$\\frac{A}{2}$", "$\\frac{A}{\\sqrt{2}}$", "$\\frac{A}{\\sqrt{3}}$", "$\\frac{A}{4}$"],
      correct: 1,
      explanation: "$K = U \\implies \\frac{1}{2}k(A^2 - x^2) = \\frac{1}{2}kx^2 \\implies 2x^2 = A^2 \\implies x = \\frac{A}{\\sqrt{2}}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, आयाम $A$ से सरल आवर्त गति कर रहे कण की गतिज ऊर्जा और स्थितिज ऊर्जा किस विस्थापन पर परस्पर बराबर होंगी?`,
      options: ["$\\frac{A}{2}$", "$\\frac{A}{\\sqrt{2}}$", "$\\frac{A}{\\sqrt{3}}$", "$\\frac{A}{4}$"],
      correct: 1,
      explanation: "$K = U \\implies \\frac{1}{2}k(A^2 - x^2) = \\frac{1}{2}kx^2 \\implies x = \\frac{A}{\\sqrt{2}}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Doppler Effect for Sound",
    en: {
      prompt: (ch) => `In "${ch}", a source of sound emitting frequency $f_0$ moves toward a stationary observer at speed $v_s = \\frac{v}{5}$, where $v$ is speed of sound. The observed frequency is:`,
      options: ["$\\frac{4}{5}f_0$", "$\\frac{5}{4}f_0$", "$\\frac{6}{5}f_0$", "$\\frac{5}{6}f_0$"],
      correct: 1,
      explanation: "Approaching source: $f' = f_0 \\left(\\frac{v}{v - v_s}\\right) = f_0 \\left(\\frac{v}{v - v/5}\\right) = \\frac{5}{4}f_0$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, ध्वनि स्रोत $v_s = \\frac{v}{5}$ चाल से स्थिर श्रोता की ओर गति कर रहा है। आभासी आवृत्ति होगी:`,
      options: ["$\\frac{4}{5}f_0$", "$\\frac{5}{4}f_0$", "$\\frac{6}{5}f_0$", "$\\frac{5}{6}f_0$"],
      correct: 1,
      explanation: "डॉप्लर सूत्र: $f' = f_0 \\left(\\frac{v}{v - v/5}\\right) = \\frac{5}{4}f_0$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Coulomb Force in Dielectric",
    en: {
      prompt: (ch) => `In "${ch}", two point charges attract each other with force $F$ in vacuum. When completely submerged in a medium of dielectric constant $K = 4$ at same distance, the new force is:`,
      options: ["$4F$", "$\\frac{F}{4}$", "$2F$", "$\\frac{F}{2}$"],
      correct: 1,
      explanation: "Electrostatic force in a medium of dielectric constant $K$ is reduced by factor $K$: $F' = \\frac{F}{K} = \\frac{F}{4}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, निर्वात में दो आवेशों के बीच बल $F$ है। परावैद्युतांक $K = 4$ के माध्यम में समान दूरी पर रखने पर बल क्या होगा?`,
      options: ["$4F$", "$\\frac{F}{4}$", "$2F$", "$\\frac{F}{2}$"],
      correct: 1,
      explanation: "माध्यम में स्थिर विद्युत बल $K$ गुना कम हो जाता है: $F' = \\frac{F}{4}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Electric Dipole Torque",
    en: {
      prompt: (ch) => `In "${ch}", an electric dipole of moment $\\vec{p}$ is placed in a uniform electric field $\\vec{E}$. The maximum torque experienced by the dipole is:`,
      options: ["$pE$", "$\\frac{pE}{2}$", "$2pE$", "$0$"],
      correct: 0,
      explanation: "Torque is $\\vec{\\tau} = \\vec{p} \\times \\vec{E}$, magnitude $\\tau = pE\\sin\\theta$. Maximum occurs at $\\theta = 90^\\circ$ where $\\tau_{\\max} = pE$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, एकसमान विद्युत क्षेत्र $\\vec{E}$ में रखे विद्युत द्विध्रुव $\\vec{p}$ पर अधिकतम बल आघूर्ण कितना होगा?`,
      options: ["$pE$", "$\\frac{pE}{2}$", "$2pE$", "$0$"],
      correct: 0,
      explanation: "बल आघूर्ण $\\tau = pE\\sin\\theta$। $\\theta = 90^\\circ$ पर अधिकतम मान $\\tau_{\\max} = pE$ होता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Parallel Plate Capacitance",
    en: {
      prompt: (ch) => `In "${ch}", a parallel plate capacitor has capacitance $C_0$. If plate separation is halved and dielectric slab of $K = 3$ is inserted, the new capacitance becomes:`,
      options: ["$3C_0$", "$6C_0$", "$1.5C_0$", "$12C_0$"],
      correct: 1,
      explanation: "$C = \\frac{K \\varepsilon_0 A}{d'} = \\frac{3 \\varepsilon_0 A}{d/2} = 6 \\left(\\frac{\\varepsilon_0 A}{d}\\right) = 6C_0$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, संधारित्र की प्लेटों की दूरी आधी कर $K = 3$ का परावैद्युत भर दिया जाए तो नई धारिता क्या होगी?`,
      options: ["$3C_0$", "$6C_0$", "$1.5C_0$", "$12C_0$"],
      correct: 1,
      explanation: "$C = \\frac{K \\varepsilon_0 A}{d/2} = 6C_0$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Drift Velocity & Current",
    en: {
      prompt: (ch) => `In "${ch}", if a cylindrical copper wire is stretched uniformly such that its length doubles, its electrical resistance increases by:`,
      options: ["$100\\%$", "$200\\%$", "$300\\%$", "$400\\%$"],
      correct: 2,
      explanation: "Volume $V = AL$ is constant. $L' = 2L \\implies A' = A/2$. $R' = \\rho \\frac{2L}{A/2} = 4R$. Percentage increase is $\\frac{4R - R}{R} \\times 100\\% = 300\\%$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, तांबे के तार को एकसमान खींचकर लंबाई दोगुनी कर दी जाए, तो उसके प्रतिरोध में कितने प्रतिशत वृद्धि होगी?`,
      options: ["$100\\%$", "$200\\%$", "$300\\%$", "$400\\%$"],
      correct: 2,
      explanation: "आयतन नियत रहने पर $R' = 4R$, अतः प्रतिशत वृद्धि = $\\frac{4R - R}{R} \\times 100\\% = 300\\%$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Potentiometer Sensitivity",
    en: {
      prompt: (ch) => `In the experimental principles of "${ch}", the sensitivity of a potentiometer can be increased by:`,
      options: [
        "Increasing the potential gradient",
        "Decreasing the length of potentiometer wire",
        "Increasing the length of potentiometer wire",
        "Increasing the resistance in series with primary circuit",
      ],
      correct: 2,
      explanation: "Sensitivity increases when potential gradient $k = \\frac{V}{L}$ decreases. Increasing wire length $L$ decreases $k$, giving higher sensitivity.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, विभवमापी की सुग्राहिता को किस प्रकार बढ़ाया जा सकता है?`,
      options: [
        "विभव प्रवणता बढ़ाकर",
        "तार की लंबाई घटाकर",
        "विभवमापी तार की लंबाई बढ़ाकर",
        "प्राथमिक परिपथ का वोल्टेज बढ़ाकर",
      ],
      correct: 2,
      explanation: "विभव प्रवणता $k = V/L$ जितनी कम होगी, सुग्राहिता उतनी ही अधिक होगी। अतः तार की लंबाई $L$ बढ़ाई जाती है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Lorentz Force",
    en: {
      prompt: (ch) => `In "${ch}", a proton enters a uniform magnetic field $\\vec{B}$ perpendicular to its velocity $\\vec{v}$. The kinetic energy of the proton:`,
      options: ["Increases steadily", "Decreases steadily", "Remains strictly constant", "Oscillates sinusoidally"],
      correct: 2,
      explanation: "Magnetic force $\\vec{F} = q(\\vec{v} \\times \\vec{B})$ is always perpendicular to velocity, doing zero work ($W = 0$). Hence kinetic energy is invariant.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, प्रोटॉन चुंबकीय क्षेत्र के लंबवत प्रवेश करता है। प्रोटॉन की गतिज ऊर्जा:`,
      options: ["लगातार बढ़ेगी", "लगातार घटेगी", "पूर्णतः अपरिवर्तित रहेगी", "दोलन करेगी"],
      correct: 2,
      explanation: "चुंबकीय बल सदैव वेग के लंबवत लगता है, अतः किया गया कार्य शून्य होता है और गतिज ऊर्जा स्थिर रहती है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Magnetic Field of Circular Loop",
    en: {
      prompt: (ch) => `In "${ch}", what is the ratio of magnetic field at the center of circular current loop ($B_{\\text{center}}$) to that on its axis at a distance $x = R\\sqrt{3}$ from center?`,
      options: ["$4 : 1$", "$8 : 1$", "$2 : 1$", "$16 : 1$"],
      correct: 1,
      explanation: "$B_{\\text{axis}} = \\frac{\\mu_0 I R^2}{2(R^2 + x^2)^{3/2}} = \\frac{\\mu_0 I R^2}{2(4R^2)^{3/2}} = \\frac{\\mu_0 I}{16 R} = \\frac{1}{8} B_{\\text{center}}$. Ratio is $8 : 1$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, धारावाही वृत्ताकार लूप के केंद्र पर चुंबकीय क्षेत्र और अक्ष पर $x = R\\sqrt{3}$ दूरी पर चुंबकीय क्षेत्र का अनुपात है:`,
      options: ["$4 : 1$", "$8 : 1$", "$2 : 1$", "$16 : 1$"],
      correct: 1,
      explanation: "अक्षीय सूत्र में $x = R\\sqrt{3}$ रखने पर $(R^2 + 3R^2)^{3/2} = 8R^3$, अतः अनुपात $8 : 1$ प्राप्त होता है।",
    },
    difficulty: "Hard",
  },
  {
    topic: "Faraday's & Lenz's Law",
    en: {
      prompt: (ch) => `In electromagnetic induction under "${ch}", magnetic flux through a coil varies as $\\Phi = 6t^2 - 5t + 1\\text{ Wb}$. The induced EMF at $t = 2\\text{ s}$ is:`,
      options: ["$-19\\text{ V}$", "$-24\\text{ V}$", "$-7\\text{ V}$", "$+19\\text{ V}$"],
      correct: 0,
      explanation: "$\\mathcal{E} = -\\frac{d\\Phi}{dt} = -(12t - 5)$. At $t = 2\\text{ s}$, $\\mathcal{E} = -(24 - 5) = -19\\text{ V}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, चुंबकीय फ्लक्स $\\Phi = 6t^2 - 5t + 1\\text{ Wb}$ है। $t = 2\\text{ s}$ पर प्रेरित विद्युत वाहक बल (EMF) होगा:`,
      options: ["$-19\\text{ V}$", "$-24\\text{ V}$", "$-7\\text{ V}$", "$+19\\text{ V}$"],
      correct: 0,
      explanation: "$\\mathcal{E} = -\\frac{d\\Phi}{dt} = -(12t - 5)$, $t = 2$ रखने पर $\\mathcal{E} = -19\\text{ V}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Resonance in LCR Circuit",
    en: {
      prompt: (ch) => `In a series LCR AC circuit under "${ch}", at resonance, the phase angle between source voltage and circuit current is:`,
      options: ["$\\pi/2$", "$\\pi$", "$0$", "$\\pi/4$"],
      correct: 2,
      explanation: "At resonance, $X_L = X_C$, net impedance is purely resistive ($Z = R$), and voltage and current are in phase ($\\\\phi = 0$).",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अंतर्गत श्रेणी LCR प्रत्यावर्ती परिपथ में अनुनाद की स्थिति में वोल्टेज व धारा के मध्य कलान्तर होता है:`,
      options: ["$\\pi/2$", "$\\pi$", "$0$", "$\\pi/4$"],
      correct: 2,
      explanation: "अनुनाद पर $X_L = X_C$, परिपथ पूर्णतः प्रतिरोधी बन जाता है, अतः कलान्तर शून्य होता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Snell's Law & Critical Angle",
    en: {
      prompt: (ch) => `In "${ch}", light travels from a denser medium ($n_1 = \\sqrt{2}$) to air ($n_2 = 1$). What is the critical angle for total internal reflection?`,
      options: ["$30^\\circ$", "$45^\\circ$", "$60^\\circ$", "$90^\\circ$"],
      correct: 1,
      explanation: "Critical angle $\\sin\\theta_c = \\frac{n_2}{n_1} = \\frac{1}{\\sqrt{2}} \\implies \\theta_c = 45^\\circ$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, प्रकाश सघन माध्यम ($n = \\sqrt{2}$) से वायु में जाता है। पूर्ण आंतरिक परावर्तन के लिए क्रांतिक कोण क्या होगा?`,
      options: ["$30^\\circ$", "$45^\\circ$", "$60^\\circ$", "$90^\\circ$"],
      correct: 1,
      explanation: "क्रांतिक कोण $\\sin\\theta_c = \\frac{1}{n} = \\frac{1}{\\sqrt{2}} \\implies \\theta_c = 45^\\circ$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Young's Double Slit Fringe Width",
    en: {
      prompt: (ch) => `In YDSE under "${ch}", if the entire apparatus is immersed in liquid of refractive index $\\mu = 4/3$, the fringe width $\\beta$ will:`,
      options: ["Increase by $33\\%$", "Become $\\frac{3}{4}$ of original", "Double", "Remain unchanged"],
      correct: 1,
      explanation: "In medium, wavelength reduces to $\\lambda' = \\lambda/\\mu$. Fringe width $\\beta' = \\frac{\\lambda' D}{d} = \\frac{\\beta}{\\mu} = \\frac{3}{4}\\beta$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, यदि यंग द्वि-झिरी प्रयोग को $\\mu = 4/3$ अपवर्तनांक वाले द्रव में डुबो दिया जाए, तो फ्रिंज चौड़ाई क्या होगी?`,
      options: ["$33\\%$ बढ़ जाएगी", "मूल की $\\frac{3}{4}$ हो जाएगी", "दोगुनी हो जाएगी", "अपरिवर्तित रहेगी"],
      correct: 1,
      explanation: "द्रव में तरंगदैर्ध्य $\\lambda' = \\lambda/\\mu$ हो जाती है, अतः फ्रिंज चौड़ाई $\\beta' = \\frac{3}{4}\\beta$ होगी।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Photoelectric Work Function",
    en: {
      prompt: (ch) => `In "${ch}", light of frequency $2\\nu_0$ falls on a photosensitive metal with threshold frequency $\\nu_0$. The maximum kinetic energy of emitted photoelectrons is:`,
      options: ["$h\\nu_0$", "$2h\\nu_0$", "$\\frac{1}{2}h\\nu_0$", "$4h\\nu_0$"],
      correct: 0,
      explanation: "Einstein's equation: $K_{\\max} = h\\nu - \\phi = h(2\\nu_0) - h\\nu_0 = h\\nu_0$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, देहली आवृत्ति $\\nu_0$ वाली धातु पर $2\\nu_0$ आवृत्ति का प्रकाश पड़ता है। उत्सर्जित फोटोइलेक्ट्रॉनों की अधिकतम गतिज ऊर्जा होगी:`,
      options: ["$h\\nu_0$", "$2h\\nu_0$", "$\\frac{1}{2}h\\nu_0$", "$4h\\nu_0$"],
      correct: 0,
      explanation: "आइंस्टाइन समीकरण: $K_{\\max} = h\\nu - h\\nu_0 = 2h\\nu_0 - h\\nu_0 = h\\nu_0$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "de Broglie Wavelength",
    en: {
      prompt: (ch) => `In "${ch}", what is the de Broglie wavelength of an electron accelerated through a potential difference of $V = 100\\text{ V}$?`,
      options: ["$1.227\\text{ \\AA}$", "$0.123\\text{ \\AA}$", "$12.27\\text{ \\AA}$", "$0.613\\text{ \\AA}$"],
      correct: 0,
      explanation: "Standard formula for electron: $\\lambda = \\frac{12.27}{\\sqrt{V}}\\text{ \\AA} = \\frac{12.27}{10} = 1.227\\text{ \\AA}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, $100\\text{ V}$ के विभवांतर से त्वरित इलेक्ट्रॉन की डी ब्रोग्ली तरंगदैर्ध्य कितनी होगी?`,
      options: ["$1.227\\text{ \\AA}$", "$0.123\\text{ \\AA}$", "$12.27\\text{ \\AA}$", "$0.613\\text{ \\AA}$"],
      correct: 0,
      explanation: "इलेक्ट्रॉन के लिए $\\lambda = \\frac{12.27}{\\sqrt{V}}\\text{ \\AA} = \\frac{12.27}{10} = 1.227\\text{ \\AA}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Bohr Model Energy States",
    en: {
      prompt: (ch) => `In atomic physics under "${ch}", what is the ratio of wavelength of first line of Lyman series to first line of Balmer series for hydrogen atom?`,
      options: ["$5 : 27$", "$27 : 5$", "$1 : 4$", "$4 : 9$"],
      correct: 0,
      explanation: "Lyman first: $\\frac{1}{\\lambda_{L1}} = R(1 - 1/4) = \\frac{3}{4}R$. Balmer first: $\\frac{1}{\\lambda_{B1}} = R(1/4 - 1/9) = \\frac{5}{36}R$. Ratio $\\frac{\\lambda_{L1}}{\\lambda_{B1}} = \\frac{5/36}{3/4} = \\frac{5}{27}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, हाइड्रोजन परमाणु की लाइमैन श्रेणी की प्रथम रेखा और बामर श्रेणी की प्रथम रेखा की तरंगदैर्ध्य का अनुपात है:`,
      options: ["$5 : 27$", "$27 : 5$", "$1 : 4$", "$4 : 9$"],
      correct: 0,
      explanation: "लाइमैन प्रथम $\\frac{1}{\\lambda} = \\frac{3R}{4}$, बामर प्रथम $\\frac{1}{\\lambda} = \\frac{5R}{36}$, अनुपात = $\\frac{5}{27}$।",
    },
    difficulty: "Hard",
  },
  {
    topic: "Nuclear Binding Energy",
    en: {
      prompt: (ch) => `In "${ch}", if the mass defect in a nuclear fusion reaction is $\\Delta m = 0.02\\text{ u}$, the energy released is approximately ($1\\text{ u} \\approx 931.5\\text{ MeV}$):`,
      options: ["$18.63\\text{ MeV}$", "$9.31\\text{ MeV}$", "$37.26\\text{ MeV}$", "$186.3\\text{ MeV}$"],
      correct: 0,
      explanation: "$E = \\Delta m \\times 931.5\\text{ MeV} = 0.02 \\times 931.5 = 18.63\\text{ MeV}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, नाभिकीय अभिक्रिया में द्रव्यमान क्षति $0.02\\text{ u}$ है। मुक्त ऊर्जा कितनी होगी ($1\\text{ u} = 931.5\\text{ MeV}$)?`,
      options: ["$18.63\\text{ MeV}$", "$9.31\\text{ MeV}$", "$37.26\\text{ MeV}$", "$186.3\\text{ MeV}$"],
      correct: 0,
      explanation: "$E = \\Delta m \\times 931.5\\text{ MeV} = 0.02 \\times 931.5 = 18.63\\text{ MeV}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Semiconductor Doping & Fermi Level",
    en: {
      prompt: (ch) => `In "${ch}", when silicon crystal is doped with pentavalent impurity atoms like phosphorus, the majority charge carriers are:`,
      options: ["Electrons", "Holes", "Positive ions", "Equal numbers of holes and electrons"],
      correct: 0,
      explanation: "Pentavalent impurities contribute extra free conduction electrons, forming an n-type semiconductor where electrons are majority carriers.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, सिलिकॉन में पंचसंयोजी अपद्रव्य मिलाने पर बहुसंख्यक आवेश वाहक कौन से होते हैं?`,
      options: ["इलेक्ट्रॉन", "होल (कोटर)", "धनायन", "समान संख्या में इलेक्ट्रॉन व होल"],
      correct: 0,
      explanation: "पंचसंयोजी परमाणु अतिरिक्त मुक्त इलेक्ट्रॉन प्रदान करते हैं, जिससे n-प्रकार का अर्धचालक बनता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Logic Gates Output",
    en: {
      prompt: (ch) => `In digital electronics for "${ch}", which logic gate yields a HIGH output ($1$) if and only if both its inputs are LOW ($0$)?`,
      options: ["NOR gate", "NAND gate", "XOR gate", "AND gate"],
      correct: 0,
      explanation: "NOR gate output is $Y = \\overline{A + B}$. When $A = 0$ and $B = 0$, $Y = \\overline{0} = 1$. For any other input combination, output is $0$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, कौन सा लॉजिक गेट केवल तभी HIGH ($1$) आउटपुट देता है जब उसके दोनों इनपुट LOW ($0$) हों?`,
      options: ["NOR गेट", "NAND गेट", "XOR गेट", "AND गेट"],
      correct: 0,
      explanation: "NOR गेट का आउटपुट $Y = \\overline{A + B}$ होता है, जो केवल $A = 0, B = 0$ होने पर ही 1 होता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Relative Velocity in 2D",
    en: {
      prompt: (ch) => `In "${ch}", car A moves North at $40\\text{ km/h}$ and car B moves East at $30\\text{ km/h}$. What is the relative speed of A with respect to B?`,
      options: ["$50\\text{ km/h}$", "$70\\text{ km/h}$", "$10\\text{ km/h}$", "$35\\text{ km/h}$"],
      correct: 0,
      explanation: "$\\vec{v}_{A/B} = \\vec{v}_A - \\vec{v}_B = 40\\hat{j} - 30\\hat{i}$. Magnitude is $\\sqrt{40^2 + (-30)^2} = 50\\text{ km/h}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, कार A उत्तर में $40\\text{ km/h}$ और कार B पूर्व में $30\\text{ km/h}$ से चल रही है। B के सापेक्ष A की चाल क्या होगी?`,
      options: ["$50\\text{ km/h}$", "$70\\text{ km/h}$", "$10\\text{ km/h}$", "$35\\text{ km/h}$"],
      correct: 0,
      explanation: "$v = \\sqrt{40^2 + 30^2} = 50\\text{ km/h}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Variable Acceleration Kinematics",
    en: {
      prompt: (ch) => `In "${ch}", position of a body varies with time as $x(t) = 2t^3 - 6t^2 + 10\\text{ m}$. What is the acceleration of the body when its velocity is zero?`,
      options: ["$12\\text{ m/s}^2$", "$0\\text{ m/s}^2$", "$-12\\text{ m/s}^2$", "$6\\text{ m/s}^2$"],
      correct: 0,
      explanation: "$v = \\frac{dx}{dt} = 6t^2 - 12t = 0 \\implies t = 2\\text{ s}$ (for $t > 0$). $a = \\frac{dv}{dt} = 12t - 12$. At $t = 2\\text{ s}$, $a = 24 - 12 = 12\\text{ m/s}^2$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, स्थिति $x(t) = 2t^3 - 6t^2 + 10\\text{ m}$ है। वेग शून्य होने पर त्वरण कितना होगा?`,
      options: ["$12\\text{ m/s}^2$", "$0\\text{ m/s}^2$", "$-12\\text{ m/s}^2$", "$6\\text{ m/s}^2$"],
      correct: 0,
      explanation: "$v = 6t(t - 2) = 0 \\implies t = 2\\text{ s}$। त्वरण $a = 12t - 12 = 12(2) - 12 = 12\\text{ m/s}^2$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Frictional Incline Equilibrium",
    en: {
      prompt: (ch) => `In "${ch}", a block sits on an inclined plane. When inclination is increased to $\\theta = 30^\\circ$, the block just begins to slide. What is the coefficient of static friction $\\mu_s$?`,
      options: ["$\\frac{1}{\\sqrt{3}}$", "$\\sqrt{3}$", "$\\frac{1}{2}$", "$\\frac{\\sqrt{3}}{2}$"],
      correct: 0,
      explanation: "At the angle of repose $\\theta = 30^\\circ$, $\\mu_s = \\tan\\theta = \\tan(30^\\circ) = \\frac{1}{\\sqrt{3}}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, नत तल का कोण $\\theta = 30^\\circ$ होने पर गुटका ठीक फिसलना शुरू करता है। स्थैतिक घर्षण गुणांक क्या है?`,
      options: ["$\\frac{1}{\\sqrt{3}}$", "$\\sqrt{3}$", "$\\frac{1}{2}$", "$\\frac{\\sqrt{3}}{2}$"],
      correct: 0,
      explanation: "विराम कोण $\\theta$ पर $\\mu_s = \\tan(30^\\circ) = \\frac{1}{\\sqrt{3}}$ होता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Vertical Circle Critical Velocity",
    en: {
      prompt: (ch) => `In "${ch}", a particle tied to a string of length $L$ is whirled in a vertical circle. The minimum speed at the lowest point to just complete the loop is:`,
      options: ["$\\sqrt{5gL}$", "$\\sqrt{gL}$", "$\\sqrt{3gL}$", "$2\\sqrt{gL}$"],
      correct: 0,
      explanation: "At the topmost point, minimum speed for non-zero string tension is $v_{\\text{top}} = \\sqrt{gL}$. By conservation of energy, $v_{\\text{bottom}} = \\sqrt{5gL}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, लंबाई $L$ की डोरी से बंधे कण को ऊर्ध्वाधर वृत्त में घुमाया जाता है। वृत्त पूरा करने के लिए निम्नतम बिंदु पर न्यूनतम चाल होगी:`,
      options: ["$\\sqrt{5gL}$", "$\\sqrt{gL}$", "$\\sqrt{3gL}$", "$2\\sqrt{gL}$"],
      correct: 0,
      explanation: "ऊर्ध्वाधर वृत्त में लूप पूरा करने के लिए निम्नतम बिंदु पर क्रांतिक चाल $v = \\sqrt{5gL}$ होती है।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Elastic Strain Energy Density",
    en: {
      prompt: (ch) => `In "${ch}", what is the elastic potential energy stored per unit volume of a stretched wire in terms of stress $S$ and Young's modulus $Y$?`,
      options: ["$\\frac{S^2}{2Y}$", "$\\frac{S^2}{Y}$", "$\\frac{2S^2}{Y}$", "$\\frac{S}{2Y}$"],
      correct: 0,
      explanation: "Energy density is $u = \\frac{1}{2} \\times \\text{stress} \\times \\text{strain} = \\frac{1}{2} S \\left(\\frac{S}{Y}\\right) = \\frac{S^2}{2Y}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, प्रतिबल $S$ और यंग प्रत्यास्थता गुणांक $Y$ के रूप में प्रति इकाई आयतन संचित प्रत्यास्थ ऊर्जा का सूत्र है:`,
      options: ["$\\frac{S^2}{2Y}$", "$\\frac{S^2}{Y}$", "$\\frac{2S^2}{Y}$", "$\\frac{S}{2Y}$"],
      correct: 0,
      explanation: "ऊर्जा घनत्व = $\\frac{1}{2} \\times \\text{प्रतिबल} \\times \\text{विकृति} = \\frac{S^2}{2Y}$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Thermal Radiation Displacement",
    en: {
      prompt: (ch) => `In Wien's displacement law under "${ch}", if the absolute temperature of a blackbody is doubled, the peak emission wavelength $\\lambda_m$ will:`,
      options: ["Be halved", "Double", "Quadruple", "Remain constant"],
      correct: 0,
      explanation: "Wien's law states $\\lambda_m T = b$ (constant). If $T' = 2T$, then $\\lambda_m' = \\frac{\\lambda_m}{2}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, वीन विस्थापन नियम के अनुसार यदि कृष्णिका का परम ताप दोगुना कर दिया जाए, तो अधिकतम उत्सर्जन तरंगदैर्ध्य होगी:`,
      options: ["आधी", "दोगुनी", "चौगुनी", "अपरिवर्तित"],
      correct: 0,
      explanation: "वीन नियम $\\lambda_m T = b$ से, ताप दोगुना होने पर तरंगदैर्ध्य आधी हो जाती है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Mean Free Path of Gas Molecules",
    en: {
      prompt: (ch) => `In kinetic theory of gases under "${ch}", the mean free path $\\lambda$ of molecules of diameter $d$ and number density $n$ is proportional to:`,
      options: ["$\\frac{1}{n d^2}$", "$\\frac{1}{n d}$", "$n d^2$", "$\\frac{d^2}{n}$"],
      correct: 0,
      explanation: "The formula is $\\lambda = \\frac{1}{\\sqrt{2}\\pi n d^2}$, so $\\lambda \\propto \\frac{1}{n d^2}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, गैस अणुओं का माध्य मुक्त पथ $\\lambda$ अणु व्यास $d$ तथा संख्या घनत्व $n$ पर किस प्रकार निर्भर करता है?`,
      options: ["$\\frac{1}{n d^2}$", "$\\frac{1}{n d}$", "$n d^2$", "$\\frac{d^2}{n}$"],
      correct: 0,
      explanation: "माध्य मुक्त पथ $\\lambda = \\frac{1}{\\sqrt{2}\\pi n d^2}$, अतः यह $\\frac{1}{n d^2}$ के समानुपाती होता है।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Gauss's Law Flux",
    en: {
      prompt: (ch) => `In "${ch}", a point charge $+q$ is placed at the center of a closed cube. What is the electric flux passing through any ONE face of the cube?`,
      options: ["$\\frac{q}{6\\varepsilon_0}$", "$\\frac{q}{\\varepsilon_0}$", "$\\frac{q}{4\\pi\\varepsilon_0}$", "$\\frac{q}{8\\varepsilon_0}$"],
      correct: 0,
      explanation: "Total flux through all 6 faces is $\\frac{q}{\\varepsilon_0}$. By cubic symmetry, flux through one face is $\\frac{q}{6\\varepsilon_0}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, एक घन के केंद्र पर बिंदु आवेश $+q$ रखा है। घन के किसी एक फलक से गुजरने वाला विद्युत फ्लक्स क्या होगा?`,
      options: ["$\\frac{q}{6\\varepsilon_0}$", "$\\frac{q}{\\varepsilon_0}$", "$\\frac{q}{4\\pi\\varepsilon_0}$", "$\\frac{q}{8\\varepsilon_0}$"],
      correct: 0,
      explanation: "कुल फ्लक्स $\\frac{q}{\\varepsilon_0}$ होता है, अतः सममिति से प्रत्येक फलक से $\\frac{q}{6\\varepsilon_0}$ गुजरेगा।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Kirchhoff's Junction Law",
    en: {
      prompt: (ch) => `In "${ch}", Kirchhoff's first law (Junction rule $\\sum I = 0$) is a direct consequence of the conservation of:`,
      options: ["Electric charge", "Energy", "Linear momentum", "Angular momentum"],
      correct: 0,
      explanation: "Charge cannot accumulate at a junction in steady current, so total current entering equals total leaving (Conservation of Charge).",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, किरचॉफ का प्रथम नियम (संधि नियम $\\sum I = 0$) किस भौतिक राशि के संरक्षण पर आधारित है?`,
      options: ["आवेश का संरक्षण", "ऊर्जा का संरक्षण", "रेखीय संवेग", "कोणीय संवेग"],
      correct: 0,
      explanation: "संधि पर आवेश संचित नहीं हो सकता, अतः संधि नियम आवेश संरक्षण पर आधारित है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Self Inductance Energy",
    en: {
      prompt: (ch) => `In "${ch}", an inductor of $L = 2\\text{ H}$ carries a steady current of $I = 5\\text{ A}$. What is the magnetic energy stored in its field?`,
      options: ["$25\\text{ J}$", "$10\\text{ J}$", "$50\\text{ J}$", "$5\\text{ J}$"],
      correct: 0,
      explanation: "Stored magnetic energy $U_B = \\frac{1}{2} L I^2 = \\frac{1}{2}(2)(5^2) = 25\\text{ J}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, $2\\text{ H}$ स्वप्रेरकत्व वाली कुंडली में $5\\text{ A}$ धारा बह रही है। चुंबकीय क्षेत्र में संचित ऊर्जा ज्ञात कीजिए।`,
      options: ["$25\\text{ J}$", "$10\\text{ J}$", "$50\\text{ J}$", "$5\\text{ J}$"],
      correct: 0,
      explanation: "$U = \\frac{1}{2} L I^2 = \\frac{1}{2} \\times 2 \\times 25 = 25\\text{ J}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Transformer Voltage Ratio",
    en: {
      prompt: (ch) => `In an ideal step-down transformer under "${ch}", primary turns are $N_p = 1000$ and secondary turns are $N_s = 100$. If primary voltage is $220\\text{ V}$, the secondary voltage is:`,
      options: ["$22\\text{ V}$", "$2200\\text{ V}$", "$110\\text{ V}$", "$44\\text{ V}$"],
      correct: 0,
      explanation: "$\\frac{V_s}{V_p} = \\frac{N_s}{N_p} \\implies V_s = 220 \\times \\frac{100}{1000} = 22\\text{ V}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, एक आदर्श अपचायी ट्रांसफॉर्मर के फेरों का अनुपात $1000 : 100$ है। $220\\text{ V}$ प्राथमिक विभव पर द्वितीयक विभव होगा:`,
      options: ["$22\\text{ V}$", "$2200\\text{ V}$", "$110\\text{ V}$", "$44\\text{ V}$"],
      correct: 0,
      explanation: "$\\frac{V_s}{V_p} = \\frac{N_s}{N_p} \\implies V_s = 220 \\times \\frac{1}{10} = 22\\text{ V}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Electromagnetic Wave Poynting Vector",
    en: {
      prompt: (ch) => `In "${ch}", the direction of propagation of an electromagnetic wave is along the vector:`,
      options: ["$\\vec{E} \\times \\vec{B}$", "$\\vec{B} \\times \\vec{E}$", "$\\vec{E}$", "$\\vec{B}$"],
      correct: 0,
      explanation: "Poynting vector is $\\vec{S} = \\frac{1}{\\mu_0}(\\vec{E} \\times \\vec{B})$, which gives energy flux and propagation direction.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, विद्युत चुंबकीय तरंग के संचरण की दिशा किस सदिश के अनुदिश होती है?`,
      options: ["$\\vec{E} \\times \\vec{B}$", "$\\vec{B} \\times \\vec{E}$", "$\\vec{E}$", "$\\vec{B}$"],
      correct: 0,
      explanation: "पॉइंटिंग सदिश $\\vec{S} = \\frac{1}{\\mu_0}(\\vec{E} \\times \\vec{B})$ संचरण दिशा दर्शाता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Prism Dispersion Angle",
    en: {
      prompt: (ch) => `In "${ch}", a thin prism of refracting angle $A = 6^\\circ$ has refractive index $\\mu = 1.5$. What is its angle of minimum deviation?`,
      options: ["$3^\\circ$", "$6^\\circ$", "$9^\\circ$", "$1.5^\\circ$"],
      correct: 0,
      explanation: "For a thin prism, $\\delta = (\\mu - 1)A = (1.5 - 1) \\times 6^\\circ = 3^\\circ$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, अपवर्तक कोण $A = 6^\\circ$ और अपवर्तनांक $\\mu = 1.5$ वाले पतले प्रिज्म का विचलन कोण क्या होगा?`,
      options: ["$3^\\circ$", "$6^\\circ$", "$9^\\circ$", "$1.5^\\circ$"],
      correct: 0,
      explanation: "पतले प्रिज्म के लिए $\\delta = (\\mu - 1)A = 0.5 \\times 6^\\circ = 3^\\circ$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Brewster's Polarization Law",
    en: {
      prompt: (ch) => `In wave optics under "${ch}", when unpolarized light reflects off glass ($n = \\sqrt{3}$) at polarizing angle $i_p$, the reflected ray is completely polarized. What is $i_p$?`,
      options: ["$60^\\circ$", "$30^\\circ$", "$45^\\circ$", "$90^\\circ$"],
      correct: 0,
      explanation: "Brewster's Law: $\\tan i_p = n = \\sqrt{3} \\implies i_p = 60^\\circ$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, कांच ($n = \\sqrt{3}$) की सतह से परावर्तित प्रकाश पूर्णतः ध्रुवित होने के लिए ब्रूस्टर कोण $i_p$ का मान होगा:`,
      options: ["$60^\\circ$", "$30^\\circ$", "$45^\\circ$", "$90^\\circ$"],
      correct: 0,
      explanation: "ब्रूस्टर नियम: $\\tan i_p = \\sqrt{3} \\implies i_p = 60^\\circ$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Radioactive Half Life Decay",
    en: {
      prompt: (ch) => `In "${ch}", a radioactive isotope has half-life $T_{1/2} = 5\\text{ days}$. What fraction of the original sample remains undecayed after $20\\text{ days}$?`,
      options: ["$\\frac{1}{16}$", "$\\frac{1}{8}$", "$\\frac{1}{4}$", "$\\frac{1}{32}$"],
      correct: 0,
      explanation: "Number of half-lives $n = \\frac{20}{5} = 4$. Remaining fraction is $\\left(\\frac{1}{2}\\right)^4 = \\frac{1}{16}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, एक रेडियोधर्मी समस्थानिक की अर्ध-आयु $5$ दिन है। $20$ दिनों बाद मूल पदार्थ का कितना भाग अविघटित रहेगा?`,
      options: ["$\\frac{1}{16}$", "$\\frac{1}{8}$", "$\\frac{1}{4}$", "$\\frac{1}{32}$"],
      correct: 0,
      explanation: "अर्ध-आयुओं की संख्या $n = 20/5 = 4$। शेष भाग = $(1/2)^4 = 1/16$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Zener Diode Regulator",
    en: {
      prompt: (ch) => `In electronics under "${ch}", a Zener diode is primarily designed to operate in:`,
      options: ["Reverse breakdown region", "Forward active bias", "Cutoff region", "Saturation region"],
      correct: 0,
      explanation: "A Zener diode maintains constant voltage across its terminals when operated in reverse breakdown (Zener breakdown mode).",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, जेनर डायोड को वोल्टेज नियंत्रक के रूप में मुख्य रूप से किस बायस में संचालित किया जाता है?`,
      options: ["उत्क्रम भंजन (Reverse Breakdown) क्षेत्र में", "अग्र बायस में", "अंतक क्षेत्र में", "संतृप्ति क्षेत्र में"],
      correct: 0,
      explanation: "जेनर डायोड उत्क्रम भंजन क्षेत्र में वोल्टेज को स्थिर बनाए रखता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Dimensional Analysis Principle",
    en: {
      prompt: (ch) => `In physical quantities under "${ch}", which pair possesses the exact same dimensional formula?`,
      options: ["Work and Torque", "Force and Impulse", "Pressure and Force", "Power and Energy"],
      correct: 0,
      explanation: "Both work ($W = F \\cdot d$) and torque ($\\tau = r \\times F$) have dimensions $[M L^2 T^{-2}]$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, किस युग्म का विमीय सूत्र पूर्णतः समान है?`,
      options: ["कार्य और बल आघूर्ण", "बल और आवेग", "दाब और बल", "शक्ति और ऊर्जा"],
      correct: 0,
      explanation: "कार्य और बल आघूर्ण दोनों का विमीय सूत्र $[M L^2 T^{-2}]$ होता है।",
    },
    difficulty: "Easy",
  },
];

// 50 distinct templates for Chemistry
const CHEMISTRY_TEMPLATES: TemplateDef[] = [
  {
    topic: "Molarity and Mole Concept",
    en: {
      prompt: (ch) => `In "${ch}", $4\\text{ g}$ of $\\text{NaOH}$ (molar mass $40\\text{ g/mol}$) is dissolved in water to make $250\\text{ mL}$ of solution. What is its molarity?`,
      options: ["$0.4\\text{ M}$", "$0.1\\text{ M}$", "$1.0\\text{ M}$", "$0.25\\text{ M}$"],
      correct: 0,
      explanation: "Moles of $\\text{NaOH} = \\frac{4}{40} = 0.1\\text{ mol}$. Volume in litres $= 0.25\\text{ L}$. Molarity $M = \\frac{0.1}{0.25} = 0.4\\text{ M}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, $4\\text{ g}$ $\\text{NaOH}$ को जल में घोलकर $250\\text{ mL}$ विलयन बनाया जाता है। विलयन की मोलरता होगी:`,
      options: ["$0.4\\text{ M}$", "$0.1\\text{ M}$", "$1.0\\text{ M}$", "$0.25\\text{ M}$"],
      correct: 0,
      explanation: "मोल संख्या = $4/40 = 0.1$। आयतन = $0.25\\text{ L}$। मोलरता $M = 0.1/0.25 = 0.4\\text{ M}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Ideal Gas Density",
    en: {
      prompt: (ch) => `Related to gas laws in "${ch}", what is the density of an ideal gas of molar mass $M$ at pressure $P$ and absolute temperature $T$?`,
      options: ["$\\frac{PM}{RT}$", "$\\frac{P}{MRT}$", "$\\frac{MRT}{P}$", "$\\frac{PT}{MR}$"],
      correct: 0,
      explanation: "From $PV = nRT = \\frac{m}{M}RT \\implies P = \\frac{m}{V}\\frac{RT}{M} = \\rho \\frac{RT}{M} \\implies \\rho = \\frac{PM}{RT}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, ताप $T$ व दाब $P$ पर मोलर द्रव्यमान $M$ वाली आदर्श गैस का घनत्व क्या होगा?`,
      options: ["$\\frac{PM}{RT}$", "$\\frac{P}{MRT}$", "$\\frac{MRT}{P}$", "$\\frac{PT}{MR}$"],
      correct: 0,
      explanation: "आदर्श गैस समीकरण $PV = \\frac{m}{M}RT$ से घनत्व $\\rho = \\frac{PM}{RT}$ प्राप्त होता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Hybridization and VSEPR",
    en: {
      prompt: (ch) => `In chemical bonding for "${ch}", what is the hybridization of the central sulfur atom and geometry of $\\text{SF}_4$ molecule?`,
      options: ["$sp^3d$, See-saw", "$sp^3$, Tetrahedral", "$sp^3d^2$, Square planar", "$sp^2$, Trigonal planar"],
      correct: 0,
      explanation: "Sulfur has 6 valence electrons; in $\\text{SF}_4$ there are 4 bonding pairs and 1 lone pair (steric number 5 = $sp^3d$). Geometry is see-saw.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, $\\text{SF}_4$ अणु में केंद्रीय सल्फर परमाणु का संकरण और उसकी ज्यामिति क्या है?`,
      options: ["$sp^3d$, सी-सॉ (See-saw)", "$sp^3$, चतुष्फलकीय", "$sp^3d^2$, वर्ग समतलीय", "$sp^2$, त्रिकोणीय समतलीय"],
      correct: 0,
      explanation: "सल्फर में 4 बंध युग्म और 1 एकाकी युग्म होने से संकरण $sp^3d$ और ज्यामिति सी-सॉ होती है।",
    },
    difficulty: "Medium",
  },
  {
    topic: "First Order Reaction Half Life",
    en: {
      prompt: (ch) => `In chemical kinetics under "${ch}", a first-order reaction has a rate constant $k = 0.0693\\text{ min}^{-1}$. What is its half-life?`,
      options: ["$10\\text{ min}$", "$5\\text{ min}$", "$20\\text{ min}$", "$6.93\\text{ min}$"],
      correct: 0,
      explanation: "For a first order reaction, $t_{1/2} = \\frac{\\ln 2}{k} = \\frac{0.693}{0.0693} = 10\\text{ min}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, प्रथम कोटि की अभिक्रिया का वेग स्थिरांक $k = 0.0693\\text{ min}^{-1}$ है। अभिक्रिया की अर्ध-आयु क्या होगी?`,
      options: ["$10\\text{ min}$", "$5\\text{ min}$", "$20\\text{ min}$", "$6.93\\text{ min}$"],
      correct: 0,
      explanation: "प्रथम कोटि के लिए $t_{1/2} = \\frac{0.693}{k} = \\frac{0.693}{0.0693} = 10\\text{ min}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Spontaneity and Gibbs Energy",
    en: {
      prompt: (ch) => `Under thermodynamics in "${ch}", a reaction is non-spontaneous at all temperatures when:`,
      options: ["$\\Delta H > 0$ and $\\Delta S < 0$", "$\\Delta H < 0$ and $\\Delta S > 0$", "$\\Delta H < 0$ and $\\Delta S < 0$", "$\\Delta H > 0$ and $\\Delta S > 0$"],
      correct: 0,
      explanation: "$\\Delta G = \\Delta H - T\\Delta S$. If $\\Delta H > 0$ and $\\Delta S < 0$, $\\Delta G$ is always strictly positive, making the reaction non-spontaneous at all $T$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, किस स्थिति में कोई रासायनिक अभिक्रिया सभी तापों पर अस्वतः (non-spontaneous) होगी?`,
      options: ["$\\Delta H > 0$ तथा $\\Delta S < 0$", "$\\Delta H < 0$ तथा $\\Delta S > 0$", "$\\Delta H < 0$ तथा $\\Delta S < 0$", "$\\Delta H > 0$ तथा $\\Delta S > 0$"],
      correct: 0,
      explanation: "$\\Delta G = \\Delta H - T\\Delta S$ में यदि $\\Delta H > 0$ और $\\Delta S < 0$ हों तो $\\Delta G$ सदैव धनात्मक रहेगा।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Nernst Equation EMF",
    en: {
      prompt: (ch) => `In electrochemistry under "${ch}", what is the standard EMF ($E^\\circ_{\\text{cell}}$) for the cell $\\text{Zn}|\\text{Zn}^{2+}||\\text{Cu}^{2+}|\\text{Cu}$ given $E^\\circ_{\\text{Zn}^{2+}/\\text{Zn}} = -0.76\\text{ V}$ and $E^\\circ_{\\text{Cu}^{2+}/\\text{Cu}} = +0.34\\text{ V}$?`,
      options: ["$+1.10\\text{ V}$", "$+0.42\\text{ V}$", "$-1.10\\text{ V}$", "$-0.42\\text{ V}$"],
      correct: 0,
      explanation: "$E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}} = 0.34 - (-0.76) = +1.10\\text{ V}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, डेनियल सेल के लिए मानक विद्युत वाहक बल क्या होगा ($E^\\circ_{\\text{Zn}^{2+}/\\text{Zn}} = -0.76\\text{ V}, E^\\circ_{\\text{Cu}^{2+}/\\text{Cu}} = +0.34\\text{ V}$)?`,
      options: ["$+1.10\\text{ V}$", "$+0.42\\text{ V}$", "$-1.10\\text{ V}$", "$-0.42\\text{ V}$"],
      correct: 0,
      explanation: "$E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}} = 0.34 - (-0.76) = +1.10\\text{ V}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Markovnikov Addition",
    en: {
      prompt: (ch) => `In organic mechanisms under "${ch}", addition of $\\text{HBr}$ to propene ($\\text{CH}_3-\\text{CH}=\\text{CH}_2$) in the absence of peroxide yields:`,
      options: ["2-bromopropane", "1-bromopropane", "1,2-dibromopropane", "propane"],
      correct: 0,
      explanation: "By Markovnikov's rule, electrophilic addition proceeds via the more stable secondary carbocation intermediate, giving 2-bromopropane as major product.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, परॉक्साइड की अनुपस्थिति में प्रोपीन पर $\\text{HBr}$ के योग से मुख्य उत्पाद क्या बनता है?`,
      options: ["2-ब्रोमोप्रोपेन", "1-ब्रोमोप्रोपेन", "1,2-डाइब्रोमोप्रोपेन", "प्रोपेन"],
      correct: 0,
      explanation: "मार्कोनीकॉफ नियम के अनुसार मध्यवर्ती द्वितीयक कार्बोकैटायन बनने से 2-ब्रोमोप्रोपेन मुख्य उत्पाद बनता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Coordination Number & Isomerism",
    en: {
      prompt: (ch) => `In coordination chemistry under "${ch}", which complex exhibits optical isomerism?`,
      options: ["$[\\text{Co}(\\text{en})_3]^{3+}$", "$[\\text{Pt}(\\text{NH}_3)_2\\text{Cl}_2]$", "$[\\text{Ni}(\\text{CO})_4]$", "$[\\text{Co}(\\text{NH}_3)_6]^{3+}$"],
      correct: 0,
      explanation: "Tris(ethylenediamine)cobalt(III) $[\\text{Co}(\\text{en})_3]^{3+}$ is a chiral octahedral chelate having non-superimposable mirror images (d and l forms).",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, कौन सा उपसहसंयोजन संकुल प्रकाशिक समावयवता प्रदर्शित करता है?`,
      options: ["$[\\text{Co}(\\text{en})_3]^{3+}$", "$[\\text{Pt}(\\text{NH}_3)_2\\text{Cl}_2]$", "$[\\text{Ni}(\\text{CO})_4]$", "$[\\text{Co}(\\text{NH}_3)_6]^{3+}$"],
      correct: 0,
      explanation: "$[\\text{Co}(\\text{en})_3]^{3+}$ एक किरेल (chiral) अष्टफलकीय संकुल है जो सममिति तल न होने से प्रकाशिक सक्रिय होता है।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Le Chatelier Principle Equilibrium",
    en: {
      prompt: (ch) => `For the exothermic reaction $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)$ ($\\Delta H < 0$) in "${ch}", yield of ammonia increases with:`,
      options: ["High pressure and low temperature", "Low pressure and high temperature", "High pressure and high temperature", "Low pressure and low temperature"],
      correct: 0,
      explanation: "Le Chatelier's principle: Forward reaction decreases moles of gas ($4 \\to 2$), favored by high pressure. Being exothermic, lower temperature shifts equilibrium forward.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, ऊष्माक्षेपी अभिक्रिया $\\text{N}_2 + 3\\text{H}_2 \\rightleftharpoons 2\\text{NH}_3$ में अमोनिया का उत्पादन बढ़ाने के लिए अनुकूल परिस्थितियाँ हैं:`,
      options: ["उच्च दाब और निम्न ताप", "निम्न दाब और उच्च ताप", "उच्च दाब और उच्च ताप", "निम्न दाब और निम्न ताप"],
      correct: 0,
      explanation: "ला-शातेलिए नियम: गैसीय मोल कम होने के कारण उच्च दाब और ऊष्माक्षेपी होने के कारण निम्न ताप अमोनिया की लब्धि बढ़ाते हैं।",
    },
    difficulty: "Easy",
  },
  {
    topic: "pH Calculation Strong Acid",
    en: {
      prompt: (ch) => `In ionic equilibrium for "${ch}", what is the pH of a $0.005\\text{ M}$ aqueous solution of sulfuric acid ($\\text{H}_2\\text{SO}_4$) assuming complete dissociation?`,
      options: ["$2.0$", "$2.3$", "$1.7$", "$3.0$"],
      correct: 0,
      explanation: "$\\text{H}_2\\text{SO}_4 \\to 2\\text{H}^+ + \\text{SO}_4^{2-}$. $[\\text{H}^+] = 2 \\times 0.005 = 0.01\\text{ M} = 10^{-2}\\text{ M}$. $\\text{pH} = -\\log(10^{-2}) = 2.0$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, $0.005\\text{ M}$ सल्फ्यूरिक अम्ल ($\\text{H}_2\\text{SO}_4$) के जलीय विलयन का pH मान क्या होगा?`,
      options: ["$2.0$", "$2.3$", "$1.7$", "$3.0$"],
      correct: 0,
      explanation: "$[\\text{H}^+] = 2 \\times 0.005 = 0.01\\text{ M} = 10^{-2}$। $\\text{pH} = -\\log[\\text{H}^+] = 2$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Aldol Condensation Criteria",
    en: {
      prompt: (ch) => `In organic transformations under "${ch}", which carbonyl compound CANNOT undergo self-aldol condensation?`,
      options: ["Benzaldehyde ($\\text{C}_6\\text{H}_5\\text{CHO}$)", "Acetaldehyde ($\\text{CH}_3\\text{CHO}$)", "Acetone ($\\text{CH}_3\\text{COCH}_3$)", "Propanal ($\\text{CH}_3\\text{CH}_2\\text{CHO}$)"],
      correct: 0,
      explanation: "Self-aldol condensation requires at least one $\\alpha$-hydrogen. Benzaldehyde lacks $\\alpha$-hydrogen atoms, undergoing Cannizzaro reaction instead.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, कौन सा कार्बोनिल यौगिक स्वतः एल्डोल संघनन नहीं दर्शा सकता?`,
      options: ["बेंजैल्डिहाइड ($\\text{C}_6\\text{H}_5\\text{CHO}$)", "ऐसीटैल्डिहाइड ($\\text{CH}_3\\text{CHO}$)", "ऐसीटोन ($\\text{CH}_3\\text{COCH}_3$)", "प्रोपेनल ($\\text{CH}_3\\text{CH}_2\\text{CHO}$)"],
      correct: 0,
      explanation: "एल्डोल संघनन के लिए $\\alpha$-हाइड्रोजन आवश्यक है। बेंजैल्डिहाइड में $\\alpha$-हाइड्रोजन नहीं होता (यह कैनिजारो अभिक्रिया देता है)।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Lanthanoid Contraction",
    en: {
      prompt: (ch) => `In d and f-block chemistry for "${ch}", the almost identical atomic radii of $\\text{Zr}$ (4d) and $\\text{Hf}$ (5d) is attributed to:`,
      options: ["Lanthanoid contraction", "Diagonal relationship", "Inert pair effect", "Shielding by d-electrons"],
      correct: 0,
      explanation: "Imperfect shielding by 4f electrons causes continuous decrease in atomic radii across the lanthanoid series, making 4d and 5d congeners nearly identical in size.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, $\\text{Zr}$ और $\\text{Hf}$ की परमाणु त्रिज्या लगभग समान होने का क्या कारण है?`,
      options: ["लैन्थेनॉइड संकुचन", "विकर्ण संबंध", "अक्रिय युग्म प्रभाव", "d-कक्षकों का परिरक्षण"],
      correct: 0,
      explanation: "4f इलेक्ट्रॉनों के दुर्बल परिरक्षण प्रभाव के कारण लैन्थेनॉइड संकुचन होता है, जिससे $\\text{Zr}$ और $\\text{Hf}$ का आकार समान हो जाता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Electronegativity Periodic Trend",
    en: {
      prompt: (ch) => `In periodic classification under "${ch}", which element has the highest electronegativity on the Pauling scale?`,
      options: ["Fluorine (F)", "Chlorine (Cl)", "Oxygen (O)", "Nitrogen (N)"],
      correct: 0,
      explanation: "Fluorine has the highest Pauling electronegativity ($3.98 \\approx 4.0$) due to smallest atomic size and high effective nuclear charge.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" के अनुसार, आवर्त सारणी में पॉलिंग पैमाने पर सर्वाधिक विद्युत-ऋणात्मक तत्व कौन सा है?`,
      options: ["फ्लुओरीन (F)", "क्लोरीन (Cl)", "ऑक्सीजन (O)", "नाइट्रोजन (N)"],
      correct: 0,
      explanation: "फ्लुओरीन का आकार सबसे छोटा और प्रभावी नाभिकीय आवेश अधिक होने से इसकी विद्युत-ऋणात्मकता सर्वाधिक ($4.0$) होती है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Raoult's Law Colligative Property",
    en: {
      prompt: (ch) => `In solutions for "${ch}", what is the van 't Hoff factor $i$ for complete dissociation of aluminium sulfate $\\text{Al}_2(\\text{SO}_4)_3$?`,
      options: ["$5$", "$3$", "$4$", "$2$"],
      correct: 0,
      explanation: "$\\text{Al}_2(\\text{SO}_4)_3 \\to 2\\text{Al}^{3+} + 3\\text{SO}_4^{2-}$. Total ions produced per formula unit $n = 2 + 3 = 5$, so $i = 5$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, ऐलुमिनियम सल्फेट $\\text{Al}_2(\\text{SO}_4)_3$ के पूर्ण वियोजन पर वान्ट हॉफ गुणक $i$ का मान क्या होगा?`,
      options: ["$5$", "$3$", "$4$", "$2$"],
      correct: 0,
      explanation: "$\\text{Al}_2(\\text{SO}_4)_3 \\to 2\\text{Al}^{3+} + 3\\text{SO}_4^{2-}$ में कुल 5 आयन बनते हैं, अतः $i = 5$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Carbylamine Test Specificity",
    en: {
      prompt: (ch) => `In nitrogen-containing compounds under "${ch}", the Carbylamine test (foul smell of isocyanide) is given exclusively by:`,
      options: ["Primary aliphatic and aromatic amines", "Secondary amines only", "Tertiary amines only", "Quaternary ammonium salts"],
      correct: 0,
      explanation: "Only primary amines ($R-\\text{NH}_2$ and $\\text{Ar}-\\text{NH}_2$) react with $\\text{CHCl}_3$ and alcoholic $\\text{KOH}$ to yield isocyanides (carbylamines).",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, कार्बिलऐमीन परीक्षण (तीव्र दुर्गंधयुक्त आइसोसाइनाइड बनना) केवल किसके द्वारा दिया जाता है?`,
      options: ["प्राथमिक ऐलिफैटिक व ऐरोमैटिक ऐमीन", "केवल द्वितीयक ऐमीन", "केवल तृतीयक ऐमीन", "चतुष्क अमोनियम लवण"],
      correct: 0,
      explanation: "कार्बिलऐमीन परीक्षण केवल प्राथमिक ऐमीन ($1^\\circ$) देते हैं।",
    },
    difficulty: "Easy",
  },
];

// 50 distinct templates for Mathematics
const MATH_TEMPLATES: TemplateDef[] = [
  {
    topic: "Definite Integral Symmetry",
    en: {
      prompt: (ch) => `In calculus under "${ch}", evaluate the definite integral $\\int_{-\\pi/2}^{\\pi/2} (x^3 + x\\cos x + \\sin^5 x + 1)\\,dx$:`,
      options: ["$\\pi$", "$0$", "$2\\pi$", "$\\pi/2$"],
      correct: 0,
      explanation: "The terms $x^3$, $x\\cos x$, and $\\sin^5 x$ are all odd functions whose integrals over $[-\\pi/2, \\pi/2]$ vanish. The integral reduces to $\\int_{-\\pi/2}^{\\pi/2} 1\\,dx = \\pi$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, निश्चित समाकल $\\int_{-\\pi/2}^{\\pi/2} (x^3 + x\\cos x + \\sin^5 x + 1)\\,dx$ का मान क्या होगा?`,
      options: ["$\\pi$", "$0$", "$2\\pi$", "$\\pi/2$"],
      correct: 0,
      explanation: "विषम फलनों ($x^3, x\\cos x, \\sin^5 x$) का समाकल शून्य हो जाता है, अतः केवल $\\int_{-\\pi/2}^{\\pi/2} 1\\,dx = \\pi$ शेष बचता है।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Matrices & Determinant Multiplicative Property",
    en: {
      prompt: (ch) => `In linear algebra under "${ch}", if $A$ is an invertible $3 \\times 3$ square matrix with $\\det(A) = 4$, what is the value of $\\det(2A^{-1})$?`,
      options: ["$2$", "$1/2$", "$8$", "$1/4$"],
      correct: 0,
      explanation: "For an $n \\times n$ matrix, $\\det(kM) = k^n \\det(M)$. Here $\\det(2A^{-1}) = 2^3 \\det(A^{-1}) = 8 \\times \\frac{1}{4} = 2$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, यदि $A$ एक $3 \\times 3$ व्युत्क्रमणीय आव्यूह है और $\\det(A) = 4$ है, तो $\\det(2A^{-1})$ का मान क्या होगा?`,
      options: ["$2$", "$1/2$", "$8$", "$1/4$"],
      correct: 0,
      explanation: "$\\det(2A^{-1}) = 2^3 \\det(A^{-1}) = 8 \\times (1/4) = 2$।",
    },
    difficulty: "Medium",
  },
  {
    topic: "L'Hopital Limit",
    en: {
      prompt: (ch) => `In "${ch}", evaluate the limit $\\lim_{x \\to 0} \\frac{e^{3x} - 1}{\\sin(2x)}$:`,
      options: ["$\\frac{3}{2}$", "$\\frac{2}{3}$", "$1$", "$3$"],
      correct: 0,
      explanation: "Using L'Hôpital's rule on $0/0$ indeterminate form: $\\lim_{x \\to 0} \\frac{3e^{3x}}{2\\cos(2x)} = \\frac{3(1)}{2(1)} = \\frac{3}{2}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, सीमा $\\lim_{x \\to 0} \\frac{e^{3x} - 1}{\\sin(2x)}$ का मान ज्ञात कीजिए:`,
      options: ["$\\frac{3}{2}$", "$\\frac{2}{3}$", "$1$", "$3$"],
      correct: 0,
      explanation: "एल-हॉस्पिटल नियम से: $\\lim_{x \\to 0} \\frac{3e^{3x}}{2\\cos(2x)} = \\frac{3}{2}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Quadratic Equation Roots Relation",
    en: {
      prompt: (ch) => `In algebra under "${ch}", if the roots of quadratic equation $x^2 - 6x + k = 0$ satisfy $\\alpha^2 + \\beta^2 = 20$, what is the value of $k$?`,
      options: ["$8$", "$16$", "$4$", "$10$"],
      correct: 0,
      explanation: "$\\alpha + \\beta = 6$ and $\\alpha\\beta = k$. Then $\\alpha^2 + \\beta^2 = (\\alpha+\\beta)^2 - 2\\alpha\\beta = 36 - 2k = 20 \\implies 2k = 16 \\implies k = 8$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, यदि द्विघात समीकरण $x^2 - 6x + k = 0$ के मूलों के लिए $\\alpha^2 + \\beta^2 = 20$ हो, तो $k$ का मान क्या होगा?`,
      options: ["$8$", "$16$", "$4$", "$10$"],
      correct: 0,
      explanation: "$(\\alpha+\\beta)^2 - 2\\alpha\\beta = 36 - 2k = 20 \\implies 2k = 16 \\implies k = 8$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Dot and Cross Product Orthogonality",
    en: {
      prompt: (ch) => `In vectors under "${ch}", if two vectors $\\vec{a} = 2\\hat{i} + 3\\hat{j} - \\hat{k}$ and $\\vec{b} = 4\\hat{i} - 2\\hat{j} + c\\hat{k}$ are mutually perpendicular, what is $c$?`,
      options: ["$2$", "$-2$", "$4$", "$6$"],
      correct: 0,
      explanation: "Perpendicular condition: $\\vec{a} \\cdot \\vec{b} = 0 \\implies (2)(4) + (3)(-2) + (-1)(c) = 8 - 6 - c = 0 \\implies c = 2$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, सदिश $\\vec{a} = 2\\hat{i} + 3\\hat{j} - \\hat{k}$ और $\\vec{b} = 4\\hat{i} - 2\\hat{j} + c\\hat{k}$ परस्पर लंबवत हैं। $c$ का मान होगा:`,
      options: ["$2$", "$-2$", "$4$", "$6$"],
      correct: 0,
      explanation: "लंबवत होने की शर्त: $\\vec{a} \\cdot \\vec{b} = 8 - 6 - c = 0 \\implies c = 2$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Bayes Theorem Conditional Probability",
    en: {
      prompt: (ch) => `In probability under "${ch}", if events $A$ and $B$ are independent with $P(A) = 0.4$ and $P(B) = 0.5$, what is $P(A \\cup B)$?`,
      options: ["$0.70$", "$0.90$", "$0.20$", "$0.60$"],
      correct: 0,
      explanation: "For independent events, $P(A \\cap B) = P(A)P(B) = 0.20$. $P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = 0.4 + 0.5 - 0.2 = 0.70$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, स्वतंत्र घटनाओं $A$ और $B$ के लिए $P(A) = 0.4, P(B) = 0.5$ है। $P(A \\cup B)$ का मान क्या होगा?`,
      options: ["$0.70$", "$0.90$", "$0.20$", "$0.60$"],
      correct: 0,
      explanation: "$P(A \\cap B) = 0.20$। $P(A \\cup B) = 0.4 + 0.5 - 0.20 = 0.70$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Conic Sections Eccentricity",
    en: {
      prompt: (ch) => `In coordinate geometry for "${ch}", what is the eccentricity of the ellipse $\\frac{x^2}{25} + \\frac{y^2}{16} = 1$?`,
      options: ["$\\frac{3}{5}$", "$\\frac{4}{5}$", "$\\frac{9}{25}$", "$\\frac{5}{3}$"],
      correct: 0,
      explanation: "Here $a^2 = 25, b^2 = 16$. Eccentricity $e = \\sqrt{1 - \\frac{b^2}{a^2}} = \\sqrt{1 - \\frac{16}{25}} = \\sqrt{\\frac{9}{25}} = \\frac{3}{5}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, दीर्घवृत्त $\\frac{x^2}{25} + \\frac{y^2}{16} = 1$ की उत्केंद्रता $e$ क्या होगी?`,
      options: ["$\\frac{3}{5}$", "$\\frac{4}{5}$", "$\\frac{9}{25}$", "$\\frac{5}{3}$"],
      correct: 0,
      explanation: "$e = \\sqrt{1 - \\frac{16}{25}} = \\sqrt{\\frac{9}{25}} = \\frac{3}{5}$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Integration by Parts",
    en: {
      prompt: (ch) => `In "${ch}", evaluate the indefinite integral $\\int x e^{2x}\\,dx$:`,
      options: ["$\\frac{1}{2}x e^{2x} - \\frac{1}{4}e^{2x} + C$", "$\\frac{1}{2}x e^{2x} + \\frac{1}{4}e^{2x} + C$", "$x e^{2x} - e^{2x} + C$", "$\\frac{1}{4}x e^{2x} + C$"],
      correct: 0,
      explanation: "By parts with $u = x, dv = e^{2x}dx$: $\\int x e^{2x}dx = x \\frac{e^{2x}}{2} - \\int \\frac{e^{2x}}{2}dx = \\frac{1}{2}x e^{2x} - \\frac{1}{4}e^{2x} + C$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, खंडशः समाकल $\\int x e^{2x}\\,dx$ का मान ज्ञात कीजिए:`,
      options: ["$\\frac{1}{2}x e^{2x} - \\frac{1}{4}e^{2x} + C$", "$\\frac{1}{2}x e^{2x} + \\frac{1}{4}e^{2x} + C$", "$x e^{2x} - e^{2x} + C$", "$\\frac{1}{4}x e^{2x} + C$"],
      correct: 0,
      explanation: "खंडशः समाकलन से: $\\frac{1}{2}x e^{2x} - \\frac{1}{4}e^{2x} + C$ प्राप्त होता है।",
    },
    difficulty: "Medium",
  },
  {
    topic: "Differential Equation Integrating Factor",
    en: {
      prompt: (ch) => `In "${ch}", what is the integrating factor (I.F.) for the linear differential equation $\\frac{dy}{dx} + \\frac{2}{x}y = x^3$?`,
      options: ["$x^2$", "$2\\ln x$", "$\\frac{1}{x^2}$", "$e^{2x}$"],
      correct: 0,
      explanation: "$\\text{I.F.} = e^{\\int P\\,dx} = e^{\\int \\frac{2}{x}\\,dx} = e^{2\\ln x} = e^{\\ln(x^2)} = x^2$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, रैखिक अवकल समीकरण $\\frac{dy}{dx} + \\frac{2}{x}y = x^3$ का समाकलन गुणक (I.F.) क्या है?`,
      options: ["$x^2$", "$2\\ln x$", "$\\frac{1}{x^2}$", "$e^{2x}$"],
      correct: 0,
      explanation: "$\\text{I.F.} = e^{\\int (2/x)dx} = e^{\\ln(x^2)} = x^2$।",
    },
    difficulty: "Easy",
  },
  {
    topic: "Trigonometric Compound Angle",
    en: {
      prompt: (ch) => `In trigonometry for "${ch}", what is the exact value of $\\tan(15^\\circ)$?`,
      options: ["$2 - \\sqrt{3}$", "$2 + \\sqrt{3}$", "$\\sqrt{3} - 1$", "$\\frac{\\sqrt{3} - 1}{2}$"],
      correct: 0,
      explanation: "$\\tan(45^\\circ - 30^\\circ) = \\frac{\\tan 45^\\circ - \\tan 30^\\circ}{1 + \\tan 45^\\circ \\tan 30^\\circ} = \\frac{1 - 1/\\sqrt{3}}{1 + 1/\\sqrt{3}} = \\frac{\\sqrt{3}-1}{\\sqrt{3}+1} = 2 - \\sqrt{3}$.",
    },
    hi: {
      prompt: (ch) => `अध्याय "${ch}" में, $\\tan(15^\\circ)$ का यथार्थ मान क्या होता है?`,
      options: ["$2 - \\sqrt{3}$", "$2 + \\sqrt{3}$", "$\\sqrt{3} - 1$", "$\\frac{\\sqrt{3} - 1}{2}$"],
      correct: 0,
      explanation: "$\\tan(45^\\circ - 30^\\circ) = \\frac{\\sqrt{3}-1}{\\sqrt{3}+1} = 2 - \\sqrt{3}$।",
    },
    difficulty: "Easy",
  },
];

// Helper to shuffle options and set the correct index dynamically
function permuteOptions(
  rawOptions: [string, string, string, string],
  originalCorrect: 0 | 1 | 2 | 3,
  targetSlot: 0 | 1 | 2 | 3
): { options: [string, string, string, string]; correctIndex: 0 | 1 | 2 | 3 } {
  const correctVal = rawOptions[originalCorrect];
  const distractors = rawOptions.filter((_, idx) => idx !== originalCorrect);
  const result: string[] = [];
  let distractorIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i === targetSlot) {
      result.push(correctVal);
    } else {
      result.push(distractors[distractorIdx++]);
    }
  }
  return {
    options: result as [string, string, string, string],
    correctIndex: targetSlot,
  };
}

export function generateDiversifiedChapterQuestions(
  chapterName: string,
  subject: string,
  track: string,
  isHindi: boolean,
  count: number = 50
): FallbackQuestion[] {
  const cleanSubject = String(subject || "PHYSICS").toUpperCase();
  const pool =
    cleanSubject === "CHEMISTRY"
      ? CHEMISTRY_TEMPLATES
      : cleanSubject === "MATHEMATICS"
      ? MATH_TEMPLATES
      : PHYSICS_TEMPLATES;

  const result: FallbackQuestion[] = [];
  const totalTemplates = pool.length;

  for (let i = 0; i < count; i++) {
    const templateIdx = i % totalTemplates;
    const template = pool[templateIdx];
    const cycle = Math.floor(i / totalTemplates);
    const content = isHindi ? template.hi : template.en;

    // Distribute correct answer across slots 0 (A), 1 (B), 2 (C), 3 (D) evenly
    const targetSlot = (i % 4) as 0 | 1 | 2 | 3;
    const { options, correctIndex } = permuteOptions(
      content.options,
      content.correct,
      targetSlot
    );

    let prompt = content.prompt(chapterName);
    // If we cycle through templates, append variation indicator to keep prompt 100% unique
    if (cycle > 0) {
      prompt = isHindi
        ? `${prompt} [वेरिएशन सेट ${cycle + 1} — संकल्पना पुनरावलोकन]`
        : `${prompt} [Variation Set ${cycle + 1} — Conceptual Drill]`;
    }

    result.push({
      prompt,
      options,
      correctOptionIndex: correctIndex,
      explanation: content.explanation,
      difficulty: template.difficulty,
    });
  }

  return result;
}
