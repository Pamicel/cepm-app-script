const optionsFromSets = (sets) => {
    /**
        computeOptions

        From the begginings (begs, an array of arrays of elements):
        [
            A,
            B,
            C
        ]

        and the ends (array of elements):
        [
            d,
            e
        ]

        add all ends to all the beginnings:
        [
            [...A, d],
            [...A, e],
            [...B, d],
            [...B, e],
            [...C, d],
            [...C, e],
        ]
     */
    const computeOptions = (begs, ends) => begs.map(beg => ends.map(end => [...beg, end])).flat();

    /**
     * Compute all possible options in the array of arrays
     * such that the elements inside the same inner array
     * don't appear together in the results and such that
     * the results stay in the same the order.
     *
     * [[1, 2], [3, 4, 5]]
     * gives
     * [[1,3],[1,4],[1,5],[2,3],[2,4],[2,5]]
     *
     */
    const computeAllOptions = (begs, rest = []) => {
        if (rest.length === 0) {
            return (begs);
        }

        const ends = rest[0];
        rest = rest.slice(1);
        begs = computeOptions(begs, ends);

        return (computeAllOptions(begs, rest));
    }

    // Set up
    const begs = sets[0].map(el => [el]);
    const rest = sets.slice(1);

    return (computeAllOptions(begs, rest));
}