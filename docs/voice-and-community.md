# Riffit — Voice and Community

_Updated 2026-11-16_

How Riffit sounds, and how its interface cultivates a kind, supportive, inclusive, and creatively adventurous community. These values should show up throughout the experience, not just during onboarding.

Everything here is proposed direction and draft copy, not final. Scope and rules live in the [project plan](../riffit-plan.md); if the two disagree, the plan wins.

**Guiding principle:** Create as little friction as possible for kindness, and as much friction as reasonable for cruelty.

**Underlying philosophy:** Riffit should not simply tell users to be kind. Its interactions, language, rewards, and community structures should make generosity and creative connection feel like the natural way to participate.

## Voice

The app should feel like a smart, funny, generous person at a creative gathering: welcoming, enthusiastic, a little irreverent, and never preachy, saccharine, or patronizing.

**The voice is:** lighthearted, warm, generous, funny, inventive, inclusive, slightly irreverent, and occasionally surprising.

Humor is the default, not an occasional garnish. Fashion is play, and the app should sound like it's having fun. When two lines are equally clear, choose the lighter, funnier one. Clarity still comes first when someone needs to act, as in errors, permissions, and safety. Even there, keep the tone easygoing, never stiff.

**Avoid:**

- Corporate positivity
- Generic motivational affirmations
- Excessive sentimentality
- Forced enthusiasm
- Preachy or moralizing instructions
- Patronizing behavioral correction
- Humor that punches down or makes users feel excluded

The app can be sincere without being earnest all the time, and celebratory without becoming performative.

## Code of conduct

Agreeing is part of onboarding (plan §13). Unlike traditional Terms of Service, this should encourage genuine engagement: large typography, one screen, minimal text, and a friendly acknowledgment button such as "I'm in." The formal Terms of Service and moderation policies remain separate.

**Draft:**

> **Make this a good place to make things.**
>
> Be curious. Be generous.
>
> Celebrate people without ranking them.
>
> Think it needs a different shoe? Riff on it.
>
> Give credit when inspiration comes from somewhere else.
>
> No harassment, hate, body shaming, or punching down.
>
> Fashion is more interesting when more people get to belong here.

## Comment prompts

Community values should appear naturally in the interface, not only in onboarding or policy pages. Rotating prompts in the comment field encourage curiosity, appreciation, and meaningful interaction instead of judgment or comparison:

- "Tell them what caught your eye…"
- "What do you love about this?"
- "Ask them about their choices…"
- "What did this make you think of?"

Avoid excessive instructional messaging. Kindness should feel like the community's natural culture, not a set of rules constantly being enforced.

## Celebrating riffs

Riffing is inherently generous: someone inspires another person to create something new. Posting a riff should feel rewarding and joyful, and the interface should celebrate **both the original inspiration and the user's own creativity**.

**Post-publication messages:**

> **Look what they started. Look what you made.**
>
> Inspiration is contagious.

> **ART HAS OCCURRED.**
>
> Somebody inspired you. You ran with it. Excellent work.

**Animation ideas:**

- Full-screen confetti or another celebratory animation for a user's first riff
- Subtler animations and/or haptic feedback for later riffs
- Occasional unexpected animations, visual surprises, or messages to keep it fresh
- An animated connection between the original post and its new riff

Don't let elaborate animations grow tiresome through repetition. Introduce variety, and consider limiting full-screen celebrations to meaningful milestones. Respect accessibility preferences, particularly Reduce Motion, and let users avoid unwanted effects.

## Loading messages and microcopy

Loading screens, popups, and other transitional moments are chances to show personality. Develop a large, rotating collection of surprising, charming, silly, funny, and occasionally thoughtful messages. Users shouldn't need to pay attention, but those who do should sometimes be rewarded with something delightful.

**Loading messages:**

- "Untangling the necklaces…"
- "Trying it with the other shoes…"
- "Adding one completely unnecessary accessory…"
- "Checking whether leopard counts as a neutral. (It does.)"
- "Making absolutely no attempt to be timeless…"
- "Waiting for inspiration to put its pants on…"

**Some can subtly reinforce community values:**

- "More weird little outfits, please."

Not every message needs a moral. Humor, weirdness, and surprise are important parts of the personality.

## When someone might be unkind

The default interface assumes good intentions. Avoid constant warnings or behavioral reminders that make users feel monitored or scolded.

A tone check before posting is planned for later (plan §20). When a comment appears potentially insulting, harassing, or unnecessarily harsh, it would add a small amount of friction and let the person reconsider without being shamed:

> **This might land harsher than you mean it to.**
>
> Want to give it another pass?

Avoid patronizing language such as "Would you say this to your best friend?" or anything that sounds like a parent or teacher correcting a child.

Gentle nudges are not a substitute for moderation (plan §13). The goal is not to assume people will behave badly, but to encourage their better instincts while staying prepared for abuse.

## Adding photos to a post

Picking photos is the first step of posting, so it should feel quick and light. Photos start uploading the moment they're picked (plan §9), and each one shows its own progress. Errors say what happened and what to do next, without blame and without technical detail.

**Picker:**

- Button: "Add photos"
- When the post already has six: "That's six. Plenty of look to work with."
- Photo library permission (only where the system asks, such as Android or a future camera option): "Riffit uses your photos only when you pick them for a post."

**Per-photo states** (shown on each preview, and read out by screen readers):

- Preparing: "Getting it ready…"
- Uploading: "Uploading…"
- Done: no label, just the photo. Screen readers hear "Photo 2 of 4, ready."
- Failed: a short reason below, with a "Try again" button.
- Every photo has a small × in the corner to remove it. Screen readers hear "Remove photo 2."

**Failure reasons:**

| What went wrong | Copy |
| --- | --- |
| The photo couldn't be opened or converted on the phone | "This photo wouldn't open. Try a different one?" |
| No connection, or the request timed out | "Couldn't reach Riffit. Check your connection and try again." |
| Signed out, or the session expired | "You've been signed out. Sign in again to keep going." |
| Signed in, but onboarding isn't finished | "Finish setting up your profile, then come back to this." |
| The server rejected the file (too large, not a JPEG, or corrupt) | "This photo didn't make it through. Try a different one?" |
| Anything else, such as a server error | "Something went sideways on our end. Try again in a bit." |

The server's three rejections share one message because each one means "this file" and the fix is the same. The specific reason goes to the logs, not the screen.

**Ordering photos:**

The first photo is the one the feed shows (plan §9), so the copy calls it the cover, like a magazine's.

- Photo 1 carries a small "Cover" label. Screen readers hear "Photo 1 of 4, cover, ready."
- Below the photos, once there are two or more: "The first photo is your cover. It's the one the feed sees first."
- Each photo has arrow buttons to move it. Screen readers hear "Move photo 2 earlier" and "Move photo 2 later." Photo 1 has no "earlier" button, and the last photo has no "later" button.
- In VoiceOver's actions on the photo itself: "Move earlier" and "Move later."
- After a move, screen readers hear where the photo landed: "Now photo 1 of 4."

## Product mechanics

Culture comes from mechanics as well as copy. Beyond the principles in the plan (§2):

- Celebrate thoughtful interaction and creative participation.
- Don't amplify outrage or hostility through engagement-driven visibility.
