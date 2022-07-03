import { dataset } from "./dataset";

type K = string | { main: string, sub: string };

const consonants: Map<string, { A: K, B: K, C: K }> = new Map([
	["p", { A: "b", B: "p", C: "m" },],
	["t", { A: { main: "d", sub: "d͡z" }, B: { main: "t", sub: "t͡s" }, C: "k" },],
	["f", { A: "v", B: "f", C: "f" },],
	["s", { A: "z", B: "s", C: "ʃ" },],
	["c", { A: "d͡ʒ", B: "t͡ʃ", C: "t͡ʃ" },],
	["x", { A: "dv", B: "dx", C: "dz" },],
	["m", { A: "m", B: "nʲ", C: "m" },],
	["r", { A: "dr", B: "r", C: "r" },],
	["l", { A: "l", B: "l", C: { main: "ʎ", sub: "i" } },],
	["q", { A: "br", B: { main: "pr", sub: "lp" }, C: "p" },],
	["š", { A: "ʒx", B: "ʃx", C: "ʒ" },],
	["d", { A: "d͡z", B: { main: "d͡zn", sub: "nt͡s" }, C: "n" },],
	["ĵ", { A: "zx", B: "sx", C: "x" },],
	["g", { A: "gnʲ", B: "nʲ", C: { main: "ŋ", sub: "n" } },],
	["y", { A: "j", B: "w", C: "ya" },],
	["w", { A: "w", B: { main: "wi", sub: "y" }, C: { main: "u", sub: "wa" } },],
	["n", { A: "n", B: "n", C: "~" }]
	// n の B 音は n じゃない？pelné を考えるに
]);

const vowel_table: ReadonlyArray<[string, string]> = [
	["a", "a"],
	["ä", "æ"],
	["e", "je:"],
	["é", "e"],
	["i", "i"],
	["u", "u"],
	["ú", "ju"],
	["úz", "o"],
	["o", "o"],
	["ö", "oe"],
	["ai", "je"],
	["ia", "ia"],
	["uy", "ui"],
	["ey", "eu"],
	["oy", "oi"],
];
const vowels: Map<string, string> = new Map(vowel_table);

type Token = string;
const to_tokens: (i: string) => Token[] = (input: string) => {
	input = input.replace(/cr/g, "㐗");
	input = input.replace(/gn/g, "㐘");
	input = input.replace(/gp/g, "㐙");
	input = input.replace(/sc/g, "㐚");
	input = input.replace(/šc/g, "㐛");
	input = input.replace(/šk/g, "㐝");
	input = input.replace(/st/g, "㐞");
	input = input.replace(/šn/g, "㐟");
	input = input.replace(/ck/g, "㐠");
	input = input.replace(/ai/g, "㞢");
	input = input.replace(/ia/g, "㞣");
	input = input.replace(/uy/g, "㞤");
	input = input.replace(/ey/g, "㞦");
	input = input.replace(/oy/g, "㞧");
	input = input.replace(/yh/g, "㞨");
	const toks = input.split("");
	return toks.map(a =>
		a === "㐗" ? "cr" :
			a === "㐘" ? "gn" :
				a === "㐙" ? "gp" :
					a === "㐚" ? "sc" :
						a === "㐛" ? "šc" :
							a === "㐝" ? "šk" :
								a === "㐞" ? "st" :
									a === "㐟" ? "šn" :
										a === "㐠" ? "ck" :
											a === "㞢" ? "ai" :
												a === "㞣" ? "ia" :
													a === "㞤" ? "uy" :
														a === "㞦" ? "ey" :
															a === "㞧" ? "oy" :
																a);
}

const digraph_table = new Map([
	["cr", "xr"],
	["gn", "xnʲ"],
	["gp", "bnʲ"],
	["sc", "ʃk"],
	["šc", "k"],
	["šk", "sk"],
	["st", "st͡s"],
	["šn", "ʃn"],
	["ck", "k"],
	["yh", ":"],
]);

type Pron = {
	letter: string,
	type: "consonant",
	sound: "A" | "B" | "C",
	is_sub: true | false | null,
	to_voiced?: true,
	to_unvoiced?: true,
} | {
	letter: string,
	type: "vowel" | "digraph",
	sound: null,
	is_sub: true | false | null,
	to_voiced?: true,
	to_unvoiced?: true,
};

const analyze: (toks: ReadonlyArray<Token>) => Pron[] = (toks) => {
	const ans: Pron[] = [];

	let i = 0;

	// 語頭。A音を期待する
	if (consonants.has(toks[0])) {
		if (toks.length <= 1) {
			// 語末なので C 音を期待
			ans.push({ letter: toks[0], type: "consonant", sound: "C", is_sub: false });
			i++;
		} else if (toks[i + 1] === "v") {
			// 強制 A 音化
			ans.push({ letter: toks[i], type: "consonant", sound: "A", is_sub: false })
			// v を読み飛ばす
			i++;
		} else if (toks[i + 1] === "z") {
			// 強制 B 音化
			ans.push({ letter: toks[i], type: "consonant", sound: "B", is_sub: false })
			// z を読み飛ばす
			i++;
		} else if (toks[i + 1] === "k") {
			// 強制 C 音化
			ans.push({ letter: toks[i], type: "consonant", sound: "C", is_sub: false })
			// k を読み飛ばす
			i++;
		} else if (vowels.has(toks[i + 1])) {
			// 直後に母音字があるなら A 音
			ans.push({ letter: toks[0], type: "consonant", sound: "A", is_sub: false });
			i++;
		} else {
			// C 音を期待
			ans.push({ letter: toks[0], type: "consonant", sound: "C", is_sub: false });
			i++;
		}
	} else if (vowels.has(toks[0])) {
		ans.push({ letter: toks[0], type: "vowel", sound: null, is_sub: null });
		i++;
	} else if (digraph_table.has(toks[0])) {
		ans.push({ letter: toks[0], type: "digraph", sound: null, is_sub: null });
		i++;
	}

	for (; i < toks.length; i++) {
		if (vowels.has(toks[i])) {
			ans.push({ letter: toks[i], type: "vowel", sound: null, is_sub: null });
		} else if (consonants.has(toks[i])) {
			if (toks.length <= i + 1) {
				// 語末なので C 音を期待
				ans.push({ letter: toks[i], type: "consonant", sound: "C", is_sub: false })
			} else if (toks[i + 1] === "v") {
				// 強制 A 音化
				ans.push({ letter: toks[i], type: "consonant", sound: "A", is_sub: false })
				// v を読み飛ばす
				i++;
			} else if (toks[i + 1] === "z") {
				// 強制 B 音化
				ans.push({ letter: toks[i], type: "consonant", sound: "B", is_sub: false })
				// z を読み飛ばす
				i++;
			} else if (toks[i + 1] === "k") {
				// 強制 C 音化
				ans.push({ letter: toks[i], type: "consonant", sound: "C", is_sub: false })
				// k を読み飛ばす
				i++;
			} else if (vowels.has(toks[i + 1])) {
				// 直後に母音字があるなら B 音
				ans.push({ letter: toks[i], type: "consonant", sound: "B", is_sub: false })
			} else if (toks[i + 1] === "j") {
				if (toks.length <= i + 2) {
					// 語末なので C 音の有声音を希望
					ans.push({ letter: toks[i], type: "consonant", sound: "C", is_sub: false, to_voiced: true })
				} else if (vowels.has(toks[i + 2])) {
					// 音節頭なので B 音の有声音を希望
					ans.push({ letter: toks[i], type: "consonant", sound: "B", is_sub: false, to_voiced: true })
				}
				i++;
			} else if (toks[i + 1] === "h") {
				if (toks.length <= i + 2) {
					// 語末なので C 音の無声音を希望
					ans.push({ letter: toks[i], type: "consonant", sound: "C", is_sub: false, to_unvoiced: true })
				} else if (vowels.has(toks[i + 2])) {
					// 音節頭なので B 音の無声音を希望
					ans.push({ letter: toks[i], type: "consonant", sound: "B", is_sub: false, to_unvoiced: true })
				}
				i++;
			} else {
				// C 音
				ans.push({ letter: toks[i], type: "consonant", sound: "C", is_sub: false })
			}

		} else if (digraph_table.has(toks[i])) {
			ans.push({ letter: toks[i], type: "digraph", sound: null, is_sub: null })
		} else {
			throw new Error(`Unexpected token ${toks[i]} found in the word ${toks.join("")}`)
		}
	}

	return ans;
}

const to_voiced = new Map([
	["ʃ", "ʒ"],
]);

const to_unvoiced = new Map([
	["ʒ", "ʃ"],
]);

const sub_pipeline: (prons: Pron[]) => Pron[] = (prons) => {
	for (let i = 0; i < prons.length; i++) {
		let pron = prons[i];
		if (pron.type === "consonant" && pron.letter === "t") {
			if (prons[i + 1] && ["i", "e", "é", "ia"].includes(prons[i + 1].letter)) {
				pron.is_sub = true;
			}
		}
	}
	return prons;
}

const to_ipa: (prons: ReadonlyArray<Pron>) => string[] = (prons) => prons.map(pron => {
	if (pron.type === "consonant") {
		let u = (() => {
			let k = consonants.get(pron.letter)![pron.sound];
			if (typeof k === "string") {
				return k;
			} else if (pron.is_sub === true) {
				return k.sub;
			} else {
				return k.main;
			}
		})();
		if (pron.to_voiced) {
			return to_voiced.get(u)!;
		} else if (pron.to_unvoiced) {
			return to_unvoiced.get(u)!;
		} else {
			return u;
		}
	} else if (pron.type === "vowel") {
		let k = vowels.get(pron.letter)!;
		return k;
	} else if (pron.type === "digraph") {
		let k = digraph_table.get(pron.letter)!
		return k;
	} else {
		let _: never = pron.type;
		throw new Error("should not reach here")
	}
});

const success_list = [];
const fail_list = [];

const normalize_ipa = (a: string) => a
	.replace(/[:']/g, "")
	.replace(/ʲ/g, "j")
	.replace(/d͡z/g, "dz")
	.replace(/y/g, "j")
	;

for (const dat of dataset) {
	try {
		const guessed = to_ipa(sub_pipeline(analyze(to_tokens(dat.word)))).join("");
		const actual = dat.pronunciation;
		if (normalize_ipa(guessed) === normalize_ipa(actual)) {
			success_list.push([dat.word, guessed, actual])
		} else {
			fail_list.push([dat.word, guessed, actual])

		}
	} catch (e: unknown) {

	}
}
console.log(success_list);
console.log(fail_list);
console.log("success_list.length", success_list.length)
console.log("fail_list.length", fail_list.length)