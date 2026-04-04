Re do the styling of this component based on below commands:

A "pouch" container at the bottom (like a wallet or flap).
Multiple account cards stacked inside the pouch.
On toggle(), cards should animate vertically upward from inside the pouch.
Cards should slide out one-by-one in sequence:
Bottom-most card comes out first
Top-most card comes out last
On toggle() again:
Cards should slide back into the pouch
Top-most card goes in first
Bottom-most goes in last
Animation Requirements:

Use smooth spring or ease-in-out animations (prefer Framer Motion).

Each card should have a slight delay to create a cascading effect.

Cards should slightly overlap when stacked.

Add subtle scale and shadow for depth.

Ensure animation feels like cards are emerging from behind the pouch flap.

Use Framer Motion variants

Add staggerChildren and delayChildren

Reverse order on closing animation

Cards should start slightly clipped/hidden behind pouch

Add mask or overflow hidden on pouch

Add slight upward arc or easing to simulate natural motion

Add z-index layering so cards appear from inside pouch

Add dynamic shadow based on card position

Add slight scale difference (top cards slightly smaller when stacked)

Add blur or glass effect to pouch

Add subtle bounce at end of animation

Do NOT use CSS keyframes

Use Framer Motion only

Use translateY and scale transforms

Do NOT break component into multiple files

Styling:

Modern fintech style (rounded corners, soft gradients, glassmorphism optional).
Use TailwindCSS for styling.
Ensure it works on mobile screens.

git tag -f v2.1.4 && git push origin v2.1.4 --force