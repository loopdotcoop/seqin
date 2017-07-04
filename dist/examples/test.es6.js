describe("Seqin", () => {
	describe("Main", () => {
		const worker = new Worker("../src/worker/seqin-worker.es6.js");

		const main = new SEQIN.Main({
			worker: worker,
			tracks: 3,
			steps: 1,
			fidelity: 5400
		});

		it("should have 16 steps", () => {
			assert.lengthOf(main.steps, 1);
		});

		it("should have 2 tracks", () => {
			assert.lengthOf(main.tracks, 3);
		});

		main.addNote({
			voice:    SEQIN.Buzz,
			track:    0,
			on:       0,
			duration: 1,
			cycles:   60,
			velocity: 0.5
		});

		main.addNote({
			voice:    SEQIN.Buzz,
			track:    1,
			on:       0,
			duration: 1,
			cycles:   80,
			velocity: 0.8
		});

		main.addNote({
			voice:    SEQIN.Buzz,
			track:    2,
			on:       0,
			duration: 1,
			cycles:   90,
			velocity: 1.0
		});

		it("should have mixed down slots", () => {
			return (new Promise(resolve => setTimeout(resolve, 1000))).then(() => {
				const buffer = main.steps[0].masterSlot.buffer.getChannelData(0);

				const hash = asmCrypto.SHA256.hex(new Uint8Array(buffer));

				assert.equal(hash, "1f7690d538aff47235621853143cfe2152e5b3bdc791fa821053655c6b88eb49");
			});
		});

	});
});
