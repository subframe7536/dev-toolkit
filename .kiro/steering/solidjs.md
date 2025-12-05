### Anti-patterns and Code Smells to Avoid

- **Reading and Writing to the Same Signal in an Effect:** This creates an infinite loop. Use the functional update form `setCount(count => count + 1)` or derived signals.
- **Writing to Signals in Effects for Derived Values:** Prefer derived signals or memoization for expensive computations (using `createMemo`).
- **Use createSignle to Manage Complex State:** This breaks fine-grain reactivity. Use `createStore()` instead.
- **Destructuring Props:** This breaks reactivity. Access props directly or use `mergeProps` and `splitProps`.
- **Using `.map` and Ternary Operators for Control Flow:** Use Solid's control flow components (`<For>`, `<Index>`, `<Show>`) to avoid unnecessary DOM elements.
- **Ignoring Cleanup Functions:** Neglecting `onCleanup` can lead to memory leaks and unexpected behavior when components unmount.