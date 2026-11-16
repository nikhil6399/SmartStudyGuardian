package com.jee.studyguardian.data

import com.jee.studyguardian.models.ChapterItem
import com.jee.studyguardian.models.ExamTrack
import com.jee.studyguardian.models.FormulaItem
import com.jee.studyguardian.models.PracticeQuestion
import com.jee.studyguardian.models.QuestionOrigin
import com.jee.studyguardian.models.Subject

object JeeContentCatalog {

    val chapters: List<ChapterItem> = listOf(
        // PHYSICS
        ChapterItem(
            id = "phy_kinematics",
            subject = Subject.PHYSICS,
            track = ExamTrack.JEE_MAIN,
            unitName = "Mechanics",
            title = "Kinematics & Projectile Motion",
            weightagePercent = 6,
            topics = listOf("1D Motion & Graphs", "Relative Velocity", "Projectile on Inclined Plane", "Circular Kinematics"),
            revisionNotes = "Separate horizontal (ax = 0) and vertical (ay = -g) components. On an inclined plane of angle beta, resolve g along and perpendicular to the incline. Always verify signs in relative motion.",
            formulas = listOf(
                FormulaItem("f_kin_1", "Range on Horizontal Ground", "R = (u^2 * sin(2*theta)) / g", "u = initial speed, theta = launch angle"),
                FormulaItem("f_kin_2", "Maximum Height", "H = (u^2 * sin^2(theta)) / (2*g)", "Vertical velocity becomes zero at peak"),
                FormulaItem("f_kin_3", "Equation of Trajectory", "y = x*tan(theta) - (g*x^2) / (2*u^2*cos^2(theta))", "Parabolic path ignoring air resistance")
            ),
            importantPoints = listOf(
                "Slope of v-t graph gives instantaneous acceleration; area gives displacement.",
                "Complementary launch angles (theta and 90 - theta) yield identical horizontal range."
            )
        ),
        ChapterItem(
            id = "phy_rotational",
            subject = Subject.PHYSICS,
            track = ExamTrack.JEE_ADVANCED,
            unitName = "Mechanics",
            title = "Rotational Dynamics",
            weightagePercent = 9,
            topics = listOf("Moment of Inertia", "Parallel & Perpendicular Axes", "Rolling Without Slipping", "Angular Momentum Conservation"),
            revisionNotes = "For pure rolling on a stationary surface, v_cm = omega * R and a_cm = alpha * R. Angular momentum is conserved about any point where net external torque is zero.",
            formulas = listOf(
                FormulaItem("f_rot_1", "Parallel Axis Theorem", "I = I_cm + M * d^2", "d = perpendicular distance between parallel axes"),
                FormulaItem("f_rot_2", "Rolling Kinetic Energy", "K = 0.5 * M * v^2 * (1 + k^2 / R^2)", "k = radius of gyration"),
                FormulaItem("f_rot_3", "Acceleration on Incline", "a = (g * sin(theta)) / (1 + I / (M * R^2))", "Valid for pure rolling")
            ),
            importantPoints = listOf(
                "Static friction does zero work during pure rolling.",
                "Instantaneous axis of rotation passes through the point of contact in pure rolling."
            )
        ),
        ChapterItem(
            id = "phy_electrostatics",
            subject = Subject.PHYSICS,
            track = ExamTrack.JEE_ADVANCED,
            unitName = "Electromagnetism",
            title = "Electrostatics & Gauss Law",
            weightagePercent = 10,
            topics = listOf("Coulomb's Law", "Electric Field & Flux", "Gauss's Law", "Electric Potential & Dipoles"),
            revisionNotes = "Electric field is conservative: E = -grad(V). Use Gaussian symmetry (spherical, cylindrical, planar) for rapid E-field evaluation.",
            formulas = listOf(
                FormulaItem("f_ele_1", "Gauss's Law", "Phi = integral(E . dA) = q_enclosed / epsilon_0", "Applies to any closed Gaussian surface"),
                FormulaItem("f_ele_2", "Dipole Axial Field", "E_axial = (2 * k * p) / r^3", "For r >> dipole length"),
                FormulaItem("f_ele_3", "Conducting Sphere Potential", "V_surface = k * Q / R", "Uniform potential inside conductor")
            ),
            importantPoints = listOf(
                "Electric field just outside a conductor is sigma / epsilon_0 normal to surface.",
                "Work done moving charge on an equipotential surface is zero."
            )
        ),
        ChapterItem(
            id = "phy_current",
            subject = Subject.PHYSICS,
            track = ExamTrack.JEE_MAIN,
            unitName = "Electromagnetism",
            title = "Current Electricity & RC Circuits",
            weightagePercent = 8,
            topics = listOf("Drift Velocity", "Kirchhoff's Laws", "Wheatstone Bridge & Potentiometer", "RC Charging & Discharging"),
            revisionNotes = "Apply KCL and nodal analysis to reduce loop equations. At t = 0 an uncharged capacitor acts as a short wire; at steady state it acts as an open circuit.",
            formulas = listOf(
                FormulaItem("f_cur_1", "Drift Current", "I = n * e * A * v_d", "n = free electron density"),
                FormulaItem("f_cur_2", "RC Charging", "q(t) = C * E * (1 - e^(-t / (R*C)))", "Time constant tau = R * C")
            ),
            importantPoints = listOf(
                "Maximum power transfer occurs when load resistance equals internal resistance."
            )
        ),
        ChapterItem(
            id = "phy_modern",
            subject = Subject.PHYSICS,
            track = ExamTrack.JEE_MAIN,
            unitName = "Modern Physics",
            title = "Photoelectric Effect & Atomic Structure",
            weightagePercent = 11,
            topics = listOf("Photoelectric Equation", "de Broglie Wavelength", "Bohr Model", "Nuclear Decay"),
            revisionNotes = "High-yield JEE scoring chapter. Remember hc = 1240 eV-nm for fast numerical calculations without calculator errors.",
            formulas = listOf(
                FormulaItem("f_mod_1", "Einstein Photoelectric Eq", "K_max = h*nu - phi_0 = e * V_s", "V_s = stopping potential"),
                FormulaItem("f_mod_2", "Bohr Energy Level", "E_n = -13.6 * (Z^2 / n^2) eV", "Hydrogen-like species")
            ),
            importantPoints = listOf(
                "Stopping potential depends only on frequency and work function, not intensity."
            )
        ),

        // CHEMISTRY
        ChapterItem(
            id = "che_thermo",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.JEE_ADVANCED,
            unitName = "Physical Chemistry",
            title = "Chemical Thermodynamics",
            weightagePercent = 9,
            topics = listOf("First Law & Enthalpy", "Entropy & Second Law", "Gibbs Free Energy", "Hess's Law"),
            revisionNotes = "Watch IUPAC sign conventions carefully: work done ON the system is positive (dU = q + w). Reaction is spontaneous when delta_G < 0.",
            formulas = listOf(
                FormulaItem("f_thm_1", "First Law", "delta_U = q + w", "w = -P_ext * delta_V (irreversible)"),
                FormulaItem("f_thm_2", "Gibbs Equation", "delta_G = delta_H - T * delta_S", "Spontaneous if delta_G < 0"),
                FormulaItem("f_thm_3", "Equilibrium Link", "delta_G_0 = -R * T * ln(K_eq)", "Standard free energy change")
            ),
            importantPoints = listOf(
                "Isothermal reversible work is always greater in magnitude than irreversible expansion."
            )
        ),
        ChapterItem(
            id = "che_equilibrium",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.JEE_MAIN,
            unitName = "Physical Chemistry",
            title = "Chemical & Ionic Equilibrium",
            weightagePercent = 8,
            topics = listOf("Kp and Kc", "Le Chatelier Principle", "pH & Buffer Solutions", "Solubility Product Ksp"),
            revisionNotes = "Equilibrium constant depends ONLY on temperature. For buffers use Henderson-Hasselbalch approximation when dissociation is small.",
            formulas = listOf(
                FormulaItem("f_eq_1", "Kp-Kc Relation", "K_p = K_c * (R * T)^(delta_n_g)", "delta_n_g = gaseous products - reactants"),
                FormulaItem("f_eq_2", "Acid Buffer pH", "pH = pK_a + log([Salt]/[Acid])", "Valid when [H+] << [Acid]")
            ),
            importantPoints = listOf(
                "Adding an inert gas at constant volume does not shift equilibrium."
            )
        ),
        ChapterItem(
            id = "che_goc",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.JEE_ADVANCED,
            unitName = "Organic Chemistry",
            title = "General Organic Chemistry (GOC)",
            weightagePercent = 12,
            topics = listOf("Inductive & Resonance Effects", "Hyperconjugation", "Aromaticity (Huckel 4n+2)", "Carbocation Stability"),
            revisionNotes = "Priority order for stability: Aromaticity > Resonance > Hyperconjugation > Inductive effect. Always check for hydride/methyl shifts in carbocations.",
            formulas = listOf(
                FormulaItem("f_goc_1", "Huckel Rule", "Pi electrons = 4n + 2", "Planar, cyclic, completely conjugated")
            ),
            importantPoints = listOf(
                "Ortho effect generally increases acidity of benzoic acid derivatives."
            )
        ),
        ChapterItem(
            id = "che_coordination",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.JEE_MAIN,
            unitName = "Inorganic Chemistry",
            title = "Coordination Compounds",
            weightagePercent = 9,
            topics = listOf("Werner's Theory", "IUPAC Naming", "Crystal Field Theory", "Geometrical & Optical Isomerism"),
            revisionNotes = "Strong field ligands (CN-, CO, NH3 with Co3+) cause pairing when delta_0 > P. Square planar d8 complexes (Pt2+, Ni2+ with CN-) are diamagnetic.",
            formulas = listOf(
                FormulaItem("f_coo_1", "Spin-Only Magnetic Moment", "mu = sqrt(n * (n + 2)) BM", "n = number of unpaired electrons")
            ),
            importantPoints = listOf(
                "Chelate complexes exhibit higher thermodynamic stability (entropy driven)."
            )
        ),

        // MATHEMATICS
        ChapterItem(
            id = "mat_calculus_diff",
            subject = Subject.MATHEMATICS,
            track = ExamTrack.JEE_ADVANCED,
            unitName = "Calculus",
            title = "Limits, Continuity & Differentiability",
            weightagePercent = 10,
            topics = listOf("Indeterminate Forms", "L'Hopital & Series Expansion", "Continuity at Boundary", "Mean Value Theorems"),
            revisionNotes = "Use Taylor expansions for 0/0 limits involving trigonometric and exponential differences before applying L'Hopital.",
            formulas = listOf(
                FormulaItem("f_cal_1", "1^infinity Form", "lim (f(x))^g(x) = e^(lim (f(x)-1)*g(x))", "Applies when f(x)->1 and g(x)->infinity"),
                FormulaItem("f_cal_2", "Leibnitz Rule", "d/dx integral(u(x)..v(x) f(t)dt) = f(v)v' - f(u)u'", "Differentiation under integral sign")
            ),
            importantPoints = listOf(
                "Every differentiable function is continuous, but the converse is false."
            )
        ),
        ChapterItem(
            id = "mat_integration",
            subject = Subject.MATHEMATICS,
            track = ExamTrack.JEE_ADVANCED,
            unitName = "Calculus",
            title = "Definite Integration & Area",
            weightagePercent = 9,
            topics = listOf("King's & Queen's Properties", "Periodic Integrals", "Wallis Formula", "Area Under Curves"),
            revisionNotes = "King's property (integral a..b f(x)dx = integral a..b f(a+b-x)dx) resolves a huge share of JEE definite integration problems cleanly.",
            formulas = listOf(
                FormulaItem("f_int_1", "King's Property", "I = integral(a..b, f(a + b - x) dx)", "Add I + I to simplify symmetric denominators")
            ),
            importantPoints = listOf(
                "Always check odd/even symmetry when limits are [-a, a]."
            )
        ),
        ChapterItem(
            id = "mat_vectors_3d",
            subject = Subject.MATHEMATICS,
            track = ExamTrack.JEE_MAIN,
            unitName = "Vectors & 3D",
            title = "Vectors & 3D Geometry",
            weightagePercent = 11,
            topics = listOf("Dot & Cross Product", "Scalar Triple Product", "Shortest Distance Between Skew Lines", "Plane & Line Intersections"),
            revisionNotes = "Highest ROI chapter in JEE Main Mathematics. Keep shortest-distance vector projection formulas memorized cleanly.",
            formulas = listOf(
                FormulaItem("f_vec_1", "Shortest Distance (Skew Lines)", "d = |(a2 - a1) . (b1 x b2)| / |b1 x b2|", "Zero if lines intersect or are coplanar"),
                FormulaItem("f_vec_2", "Vector Triple Product", "a x (b x c) = (a . c)b - (a . b)c", "Back-minus-cab identity")
            ),
            importantPoints = listOf(
                "Scalar triple product [a b c] represents signed volume of parallelepiped."
            )
        ),
        ChapterItem(
            id = "mat_complex_quad",
            subject = Subject.MATHEMATICS,
            track = ExamTrack.JEE_MAIN,
            unitName = "Algebra",
            title = "Quadratic Equations & Complex Numbers",
            weightagePercent = 8,
            topics = listOf("Location of Roots", "De Moivre's Theorem", "Cube Roots of Unity", "Geometric Loci in Argand Plane"),
            revisionNotes = "Visualize |z - z1| = |z - z2| as perpendicular bisector and arg((z-z1)/(z-z2)) = pi/2 as circle.",
            formulas = listOf(
                FormulaItem("f_alg_1", "Cube Roots Identity", "1 + omega + omega^2 = 0; omega^3 = 1", "omega = e^(i*2*pi/3)")
            ),
            importantPoints = listOf(
                "For real coefficients, non-real roots always occur in conjugate pairs."
            )
        ),

        // CLASS 10 BOARD
        ChapterItem(
            id = "c10_light",
            subject = Subject.PHYSICS,
            track = ExamTrack.CLASS_10_BOARD,
            unitName = "Class 10 Optics",
            title = "Light: Reflection & Refraction",
            weightagePercent = 12,
            topics = listOf("Spherical Mirrors", "Mirror & Lens Formulas", "Snell's Law", "Power of Lens"),
            revisionNotes = "Follow New Cartesian Sign Convention strictly in Class 10 Board numericals: object distance u is always negative, convex lens/mirror focal length f is positive.",
            formulas = listOf(
                FormulaItem("f_c10_1", "Mirror Formula", "1/f = 1/v + 1/u", "f = R/2 for spherical mirrors"),
                FormulaItem("f_c10_2", "Lens Formula & Power", "1/f = 1/v - 1/u ; P = 1/f(m)", "SI unit of power is Dioptre (D)")
            ),
            importantPoints = listOf(
                "Draw ray diagrams neatly with arrowheads for full Class 10 Board marks."
            )
        ),
        ChapterItem(
            id = "c10_chemical_rxn",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.CLASS_10_BOARD,
            unitName = "Class 10 Chemistry",
            title = "Chemical Reactions, Acids & Bases",
            weightagePercent = 11,
            topics = listOf("Balancing Equations", "Redox Reactions", "pH Scale", "Bleaching Powder & Baking Soda"),
            revisionNotes = "Always balance atoms on both sides and state physical states (s, l, g, aq). pH < 7 is acidic, pH = 7 neutral, pH > 7 basic.",
            formulas = listOf(
                FormulaItem("f_c10_3", "Plaster of Paris", "CaSO4.2H2O -> CaSO4.0.5H2O + 1.5H2O (373 K)", "Gypsum heated at 373 K")
            ),
            importantPoints = listOf(
                "Tooth enamel starts corroding when mouth pH drops below 5.5."
            )
        ),
        ChapterItem(
            id = "c10_trigonometry",
            subject = Subject.MATHEMATICS,
            track = ExamTrack.CLASS_10_BOARD,
            unitName = "Class 10 Maths",
            title = "Trigonometry & Quadratic Equations",
            weightagePercent = 12,
            topics = listOf("Trigonometric Identities", "Heights & Distances", "Discriminant & Nature of Roots"),
            revisionNotes = "Convert sec, cosec, tan, cot into sin and cos while proving board identities. Discriminant D = b^2 - 4ac decides real vs equal roots.",
            formulas = listOf(
                FormulaItem("f_c10_4", "Pythagorean Identity", "sin^2(theta) + cos^2(theta) = 1", "Also 1 + tan^2 = sec^2"),
                FormulaItem("f_c10_5", "Quadratic Formula", "x = (-b +/- sqrt(b^2 - 4ac)) / (2a)", "Real roots exist when D >= 0")
            ),
            importantPoints = listOf(
                "Always state the angle of elevation/depression clearly in height & distance word problems."
            )
        ),

        // CLASS 12 BOARD, NEET UG & CUET / NDA
        ChapterItem(
            id = "c12_optics",
            subject = Subject.PHYSICS,
            track = ExamTrack.CLASS_12_BOARD,
            unitName = "Class 12 Optics",
            title = "Ray & Wave Optics (Board + CUET)",
            weightagePercent = 14,
            topics = listOf("Lens Maker Formula", "Prism Deviation", "Young's Double Slit", "Huygens Principle"),
            revisionNotes = "Key Class 12 Board derivations: Lens Maker's formula, refractive index of prism, and fringe width beta = lambda*D / d.",
            formulas = listOf(
                FormulaItem("f_c12_1", "Lens Maker Formula", "1/f = (n - 1) * (1/R1 - 1/R2)", "n = relative refractive index"),
                FormulaItem("f_c12_2", "YDSE Fringe Width", "beta = (lambda * D) / d", "Equal for bright and dark fringes")
            ),
            importantPoints = listOf(
                "In YDSE, fringe width increases when wavelength increases or screen distance D increases."
            )
        ),
        ChapterItem(
            id = "c12_electrochem",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.CLASS_12_BOARD,
            unitName = "Class 12 Physical Chemistry",
            title = "Electrochemistry & Nernst Equation",
            weightagePercent = 9,
            topics = listOf("Nernst Equation", "Kohlrausch Law", "Faraday Electrolysis", "Conductance"),
            revisionNotes = "At 298 K, E_cell = E0_cell - (0.0591 / n) * log10(Q). Molar conductivity increases on dilution for both strong and weak electrolytes.",
            formulas = listOf(
                FormulaItem("f_c12_3", "Nernst Equation (298 K)", "E_cell = E0_cell - (0.0591 / n) * log(Q)", "n = moles of electrons transferred")
            ),
            importantPoints = listOf(
                "At equilibrium, E_cell = 0 and delta_G0 = -n * F * E0_cell."
            )
        ),
        ChapterItem(
            id = "neet_solutions",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.NEET,
            unitName = "NEET Physical Chemistry",
            title = "Solutions & Colligative Properties",
            weightagePercent = 8,
            topics = listOf("Raoult's Law", "Elevation in Boiling Point", "Osmotic Pressure", "van 't Hoff Factor"),
            revisionNotes = "For NEET UG, memorize van 't Hoff factor i corrections for associating/dissociating solutes and watch molarity vs molality unit traps.",
            formulas = listOf(
                FormulaItem("f_neet_1", "Osmotic Pressure", "pi = i * C * R * T", "C = molarity in mol/L")
            ),
            importantPoints = listOf(
                "Osmotic pressure is preferred for determining molar mass of biomolecules at room temperature."
            )
        ),
        ChapterItem(
            id = "cuet_matrices",
            subject = Subject.MATHEMATICS,
            track = ExamTrack.CUET_NDA,
            unitName = "CUET & NDA Algebra",
            title = "Matrices, Determinants & Probability",
            weightagePercent = 12,
            topics = listOf("Inverse of Matrix", "Properties of Determinants", "Bayes' Theorem", "Conditional Probability"),
            revisionNotes = "High-scoring unit for Class 12 Board, CUET, and NDA. Verify |A| != 0 before computing A^-1 = adj(A)/|A|.",
            formulas = listOf(
                FormulaItem("f_cuet_1", "Adjoint Determinant", "|adj(A)| = |A|^(n - 1)", "n = order of square matrix A")
            ),
            importantPoints = listOf(
                "Always check whether events are independent: P(A and B) = P(A) * P(B)."
            )
        ),
        ChapterItem(
            id = "c9_motion_laws",
            subject = Subject.PHYSICS,
            track = ExamTrack.CLASS_9,
            unitName = "Class 9 Physics",
            title = "Motion, Force & Laws of Gravitation",
            weightagePercent = 12,
            topics = listOf("Equations of Motion", "Newton's Laws", "Momentum Conservation", "Universal Gravitation"),
            revisionNotes = "Three equations of uniformly accelerated motion: v = u + at, s = ut + 0.5*a*t^2, v^2 = u^2 + 2as. Momentum p = m*v is conserved in absence of external force.",
            formulas = listOf(
                FormulaItem("f_c9_1", "Second Law of Motion", "F = m * a", "SI unit is Newton (N)"),
                FormulaItem("f_c9_2", "Universal Gravitation", "F = G * m1 * m2 / r^2", "G = 6.67e-11 N*m^2/kg^2")
            ),
            importantPoints = listOf("Mass stays constant everywhere while weight W = m*g changes with g.")
        ),
        ChapterItem(
            id = "c9_atoms_molecules",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.CLASS_9,
            unitName = "Class 9 Chemistry",
            title = "Atoms, Molecules & Mole Concept",
            weightagePercent = 10,
            topics = listOf("Laws of Chemical Combination", "Dalton Atomic Theory", "Molar Mass", "Mole Calculations"),
            revisionNotes = "1 mole of any substance contains 6.022e23 particles (Avogadro constant). Number of moles n = Given Mass / Molar Mass.",
            formulas = listOf(
                FormulaItem("f_c9_3", "Number of Moles", "n = m / M = N / N_A", "N_A = 6.022e23 mol^-1")
            ),
            importantPoints = listOf("Total mass of reactants equals total mass of products in any chemical reaction.")
        ),
        ChapterItem(
            id = "c9_polynomials",
            subject = Subject.MATHEMATICS,
            track = ExamTrack.CLASS_9,
            unitName = "Class 9 Algebra",
            title = "Polynomials & Linear Equations",
            weightagePercent = 11,
            topics = listOf("Remainder Theorem", "Factor Theorem", "Algebraic Identities", "Linear Equations in 2 Variables"),
            revisionNotes = "By Factor Theorem, (x - a) is a factor of p(x) if and only if p(a) = 0. Remember (a + b + c)^2 and a^3 + b^3 + c^3 - 3abc identities.",
            formulas = listOf(
                FormulaItem("f_c9_4", "Cubic Identity", "a^3 + b^3 + c^3 - 3abc = (a+b+c)(a^2+b^2+c^2-ab-bc-ca)", "If a+b+c = 0 then a^3+b^3+c^3 = 3abc")
            ),
            importantPoints = listOf("A linear equation ax + by + c = 0 has infinitely many solutions represented by a straight line.")
        ),
        ChapterItem(
            id = "c11_work_energy",
            subject = Subject.PHYSICS,
            track = ExamTrack.CLASS_11,
            unitName = "Class 11 Mechanics",
            title = "Work, Energy, Power & Collisions",
            weightagePercent = 9,
            topics = listOf("Work-Energy Theorem", "Conservative Forces", "Potential Energy Curves", "Elastic & Inelastic Collisions"),
            revisionNotes = "Work done by all forces equals change in kinetic energy: W_net = K_f - K_i. In 1D elastic collisions, relative speed of separation equals speed of approach.",
            formulas = listOf(
                FormulaItem("f_c11_1", "Work-Energy Theorem", "W_net = 0.5 * m * v^2 - 0.5 * m * u^2", "Valid in inertial frames"),
                FormulaItem("f_c11_2", "Spring Potential Energy", "U = 0.5 * k * x^2", "k = spring stiffness constant")
            ),
            importantPoints = listOf("Mechanical energy E = K + U stays conserved when only conservative forces do work.")
        ),
        ChapterItem(
            id = "c11_bonding",
            subject = Subject.CHEMISTRY,
            track = ExamTrack.CLASS_11,
            unitName = "Class 11 Inorganic Chemistry",
            title = "Chemical Bonding & VSEPR Theory",
            weightagePercent = 10,
            topics = listOf("VSEPR Geometry", "Hybridization (sp, sp2, sp3)", "Molecular Orbital Theory", "Hydrogen Bonding"),
            revisionNotes = "Lone pair-lone pair repulsion > lone pair-bond pair > bond pair-bond pair. Bond Order = 0.5 * (N_b - N_a).",
            formulas = listOf(
                FormulaItem("f_c11_3", "MOT Bond Order", "Bond Order = 0.5 * (N_b - N_a)", "Zero or negative means unstable molecule")
            ),
            importantPoints = listOf("Species with unpaired electrons in molecular orbitals are paramagnetic (e.g. O2).")
        ),
        ChapterItem(
            id = "c11_conics",
            subject = Subject.MATHEMATICS,
            track = ExamTrack.CLASS_11,
            unitName = "Class 11 Coordinate Geometry",
            title = "Straight Lines, Circles & Conic Sections",
            weightagePercent = 10,
            topics = listOf("Slope & Distance Formula", "Circle Equation", "Parabola y^2 = 4ax", "Ellipse & Hyperbola Eccentricity"),
            revisionNotes = "Distance of point (x1, y1) from ax + by + c = 0 is |ax1 + by1 + c| / sqrt(a^2 + b^2). Conic eccentricity: e = 1 (parabola), e < 1 (ellipse), e > 1 (hyperbola).",
            formulas = listOf(
                FormulaItem("f_c11_4", "Standard Circle", "(x - h)^2 + (y - k)^2 = r^2", "Center (h, k) and radius r")
            ),
            importantPoints = listOf("For ellipse x^2/a^2 + y^2/b^2 = 1 (a > b), eccentricity e = sqrt(1 - b^2/a^2).")
        )
    )

    // Clearly labeled Sample Practice & Reference Concept questions (never mislabeled as official PYQs)
    val questions: List<PracticeQuestion> = listOf(
        PracticeQuestion(
            id = "q_phy_1",
            subject = Subject.PHYSICS,
            chapterId = "phy_kinematics",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (Kinematics)",
            prompt = "A projectile is launched from horizontal ground at 40 m/s at an angle of 30 degrees above the horizontal. Taking g = 10 m/s^2, what is the maximum height reached?",
            options = listOf("10 m", "20 m", "40 m", "80 m"),
            correctOptionIndex = 1,
            explanation = "H = (u^2 * sin^2(30)) / (2g) = (1600 * 0.25) / 20 = 400 / 20 = 20 m.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_phy_2",
            subject = Subject.PHYSICS,
            chapterId = "phy_rotational",
            track = ExamTrack.JEE_ADVANCED,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (Rotational)",
            prompt = "A solid sphere rolls without slipping down an inclined plane of angle 30 degrees. What is its linear acceleration down the incline (in terms of g)?",
            options = listOf("g / 2", "5g / 14", "5g / 7", "g / 3"),
            correctOptionIndex = 1,
            explanation = "For a solid sphere, I / (MR^2) = 2/5. Thus a = (g * sin 30) / (1 + 2/5) = (g/2) / (7/5) = 5g / 14.",
            difficulty = "Medium"
        ),
        PracticeQuestion(
            id = "q_phy_3",
            subject = Subject.PHYSICS,
            chapterId = "phy_electrostatics",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.REFERENCE_CONCEPT,
            yearOrSourceNote = "Reference Concept Check (Gauss Law)",
            prompt = "A point charge +Q is placed at the center of a cube of side a. What is the total electric flux passing through ONE face of the cube?",
            options = listOf("Q / epsilon_0", "Q / (6 * epsilon_0)", "Q / (4 * epsilon_0)", "Zero"),
            correctOptionIndex = 1,
            explanation = "By Gauss's Law, total flux through all 6 symmetric faces is Q / epsilon_0. Therefore flux through 1 face is Q / (6 * epsilon_0).",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_phy_4",
            subject = Subject.PHYSICS,
            chapterId = "phy_modern",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (Photoelectric)",
            prompt = "Light of wavelength 310 nm strikes a metal plate whose work function is 2.2 eV. Using hc = 1240 eV-nm, what is the maximum kinetic energy of emitted photoelectrons?",
            options = listOf("1.2 eV", "1.8 eV", "2.2 eV", "4.0 eV"),
            correctOptionIndex = 1,
            explanation = "Incident photon energy E = 1240 / 310 = 4.0 eV. K_max = E - phi_0 = 4.0 - 2.2 = 1.8 eV.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_che_1",
            subject = Subject.CHEMISTRY,
            chapterId = "che_thermo",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (Thermodynamics)",
            prompt = "For a reaction at 300 K, delta_H = -20 kJ/mol and delta_S = -50 J/(mol.K). What is delta_G at 300 K?",
            options = listOf("-5 kJ/mol", "-35 kJ/mol", "+5 kJ/mol", "-15 kJ/mol"),
            correctOptionIndex = 0,
            explanation = "delta_G = delta_H - T * delta_S = -20 kJ - (300 * -0.050 kJ) = -20 + 15 = -5 kJ/mol.",
            difficulty = "Medium"
        ),
        PracticeQuestion(
            id = "q_che_2",
            subject = Subject.CHEMISTRY,
            chapterId = "che_equilibrium",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.REFERENCE_CONCEPT,
            yearOrSourceNote = "Reference Concept Check (Equilibrium)",
            prompt = "For the gas-phase reaction N2(g) + 3H2(g) <-> 2NH3(g), what is the relation between Kp and Kc?",
            options = listOf("Kp = Kc (RT)^2", "Kp = Kc (RT)^-2", "Kp = Kc (RT)^-1", "Kp = Kc"),
            correctOptionIndex = 1,
            explanation = "delta_n_g = 2 - (1 + 3) = -2. Using Kp = Kc(RT)^delta_n_g gives Kp = Kc(RT)^-2.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_che_3",
            subject = Subject.CHEMISTRY,
            chapterId = "che_goc",
            track = ExamTrack.JEE_ADVANCED,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (GOC)",
            prompt = "Which of the following species satisfies Huckel's rule and is aromatic?",
            options = listOf("Cyclobutadiene", "Cyclopentadienyl anion", "Cyclooctatetraene (tub)", "Cyclopropenyl anion"),
            correctOptionIndex = 1,
            explanation = "Cyclopentadienyl anion is planar, cyclic, conjugated, and has 6 pi electrons (4n + 2 with n = 1), making it aromatic.",
            difficulty = "Medium"
        ),
        PracticeQuestion(
            id = "q_che_4",
            subject = Subject.CHEMISTRY,
            chapterId = "che_coordination",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (Coordination)",
            prompt = "What is the spin-only magnetic moment of [Fe(CN)6]^4- (Fe2+, d6 with strong-field CN- ligand)?",
            options = listOf("0 BM", "2.83 BM", "4.90 BM", "5.92 BM"),
            correctOptionIndex = 0,
            explanation = "CN- is a strong-field ligand causing complete pairing of the 6 d-electrons in t2g^6 eg^0. Number of unpaired electrons n = 0, so mu = 0 BM.",
            difficulty = "Medium"
        ),
        PracticeQuestion(
            id = "q_mat_1",
            subject = Subject.MATHEMATICS,
            chapterId = "mat_calculus_diff",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (Limits)",
            prompt = "Evaluate lim(x -> 0) (1 + 3x)^(2/x).",
            options = listOf("e^3", "e^5", "e^6", "e^2"),
            correctOptionIndex = 2,
            explanation = "Using the 1^infinity form: e^(lim(x->0) 3x * (2/x)) = e^6.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_mat_2",
            subject = Subject.MATHEMATICS,
            chapterId = "mat_integration",
            track = ExamTrack.JEE_ADVANCED,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (Definite Integration)",
            prompt = "What is the value of the definite integral from 0 to pi/2 of sin^2(x) / (sin^2(x) + cos^2(x)) dx?",
            options = listOf("pi / 4", "pi / 2", "1", "pi / 8"),
            correctOptionIndex = 0,
            explanation = "Since sin^2(x) + cos^2(x) = 1, the integral becomes integral from 0 to pi/2 of sin^2(x) dx = (1/2) * (pi/2) = pi / 4.",
            difficulty = "Medium"
        ),
        PracticeQuestion(
            id = "q_mat_3",
            subject = Subject.MATHEMATICS,
            chapterId = "mat_vectors_3d",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Sample Practice Problem (Vectors)",
            prompt = "If vectors a = i + j and b = j + k, what is the angle between a and b?",
            options = listOf("30 degrees", "45 degrees", "60 degrees", "90 degrees"),
            correctOptionIndex = 2,
            explanation = "a . b = 1, |a| = sqrt(2), |b| = sqrt(2). cos(theta) = 1 / 2, so theta = 60 degrees.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_mat_4",
            subject = Subject.MATHEMATICS,
            chapterId = "mat_complex_quad",
            track = ExamTrack.JEE_MAIN,
            origin = QuestionOrigin.REFERENCE_CONCEPT,
            yearOrSourceNote = "Reference Concept Check (Complex Numbers)",
            prompt = "If omega is a non-real cube root of unity, what is the value of (1 + omega - omega^2)^3?",
            options = listOf("8", "-8", "0", "-1"),
            correctOptionIndex = 1,
            explanation = "Since 1 + omega = -omega^2, expression becomes (-2 * omega^2)^3 = -8 * omega^6 = -8.",
            difficulty = "Medium"
        ),
        PracticeQuestion(
            id = "q_c10_phy_1",
            subject = Subject.PHYSICS,
            chapterId = "c10_light",
            track = ExamTrack.CLASS_10_BOARD,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Class 10 Board Sample Problem",
            prompt = "A convex lens has a focal length of +25 cm. What is its power in Dioptres?",
            options = listOf("+2.5 D", "+4.0 D", "-4.0 D", "+0.25 D"),
            correctOptionIndex = 1,
            explanation = "Focal length f = +25 cm = +0.25 m. Power P = 1 / f(m) = 1 / 0.25 = +4.0 D.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_c10_mat_1",
            subject = Subject.MATHEMATICS,
            chapterId = "c10_trigonometry",
            track = ExamTrack.CLASS_10_BOARD,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Class 10 Board Sample Problem",
            prompt = "For which value of k does the quadratic equation 2x^2 + kx + 2 = 0 have two equal real roots?",
            options = listOf("k = +/- 2", "k = +/- 4", "k = 8", "k = 0"),
            correctOptionIndex = 1,
            explanation = "For equal real roots, Discriminant D = b^2 - 4ac = 0 => k^2 - 4(2)(2) = 0 => k^2 = 16 => k = +/- 4.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_c12_phy_1",
            subject = Subject.PHYSICS,
            chapterId = "c12_optics",
            track = ExamTrack.CLASS_12_BOARD,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Class 12 Board Sample Problem",
            prompt = "In Young's double-slit experiment, if the slit separation d is halved and screen distance D is doubled, what happens to the fringe width beta?",
            options = listOf("Remains unchanged", "Becomes 2 times", "Becomes 4 times", "Becomes 1/4 times"),
            correctOptionIndex = 2,
            explanation = "Since beta = lambda * D / d, doubling D and halving d gives beta_new = lambda * (2D) / (d/2) = 4 * beta.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_neet_che_1",
            subject = Subject.CHEMISTRY,
            chapterId = "neet_solutions",
            track = ExamTrack.NEET,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "NEET UG Sample Problem",
            prompt = "Assuming complete dissociation in dilute aqueous solution, what is the van 't Hoff factor (i) for K2SO4?",
            options = listOf("1", "2", "3", "4"),
            correctOptionIndex = 2,
            explanation = "K2SO4 dissociates into 2 K+ ions and 1 SO4^2- ion, producing 3 ions per formula unit (i = 3).",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_cuet_mat_1",
            subject = Subject.MATHEMATICS,
            chapterId = "cuet_matrices",
            track = ExamTrack.CUET_NDA,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "CUET & NDA Sample Problem",
            prompt = "If A is a 3x3 square matrix with determinant |A| = 5, what is the value of |adj(A)|?",
            options = listOf("5", "15", "25", "125"),
            correctOptionIndex = 2,
            explanation = "For an n x n matrix, |adj(A)| = |A|^(n - 1). Here n = 3, so |adj(A)| = 5^(3 - 1) = 25.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_c9_phy_1",
            subject = Subject.PHYSICS,
            chapterId = "c9_motion_laws",
            track = ExamTrack.CLASS_9,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Class 9 NCERT Foundation",
            prompt = "A car accelerates uniformly from rest to 20 m/s in 5 s. What distance does it cover in this time?",
            options = listOf("25 m", "50 m", "100 m", "200 m"),
            correctOptionIndex = 1,
            explanation = "a = (20 - 0)/5 = 4 m/s^2. Distance s = ut + 0.5*a*t^2 = 0 + 0.5 * 4 * 25 = 50 m.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_c9_mat_1",
            subject = Subject.MATHEMATICS,
            chapterId = "c9_polynomials",
            track = ExamTrack.CLASS_9,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Class 9 NCERT Foundation",
            prompt = "What is the remainder when p(x) = x^3 - 3x^2 + 4x - 2 is divided by (x - 1)?",
            options = listOf("0", "1", "-2", "4"),
            correctOptionIndex = 0,
            explanation = "By Remainder Theorem, remainder = p(1) = 1 - 3 + 4 - 2 = 0.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_c11_phy_1",
            subject = Subject.PHYSICS,
            chapterId = "c11_work_energy",
            track = ExamTrack.CLASS_11,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Class 11 Physics Practice",
            prompt = "A body of mass 2 kg moves at 6 m/s. How much work is required to stop it completely?",
            options = listOf("-18 J", "-36 J", "+36 J", "-12 J"),
            correctOptionIndex = 1,
            explanation = "W_net = K_f - K_i = 0 - 0.5 * 2 * 6^2 = -36 J.",
            difficulty = "Easy"
        ),
        PracticeQuestion(
            id = "q_c11_che_1",
            subject = Subject.CHEMISTRY,
            chapterId = "c11_bonding",
            track = ExamTrack.CLASS_11,
            origin = QuestionOrigin.SAMPLE_PRACTICE,
            yearOrSourceNote = "Class 11 Chemistry Practice",
            prompt = "What is the hybridization of Carbon and shape of a methane (CH4) molecule?",
            options = listOf("sp2, Trigonal planar", "sp3, Tetrahedral", "sp, Linear", "sp3d, Seesaw"),
            correctOptionIndex = 1,
            explanation = "Carbon in CH4 forms 4 sigma bonds with zero lone pairs, giving sp3 hybridization and tetrahedral geometry (109.5 degrees).",
            difficulty = "Easy"
        )
    )
}
