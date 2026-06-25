---

# UI & Visual QA Standards

## General Principle

Always optimise for the best user experience, not just working code.

Do not consider a task complete simply because it functions. Review the finished result as a designer and frontend developer would.

---

## Visual QA

After every design, layout or styling change:

- Launch the local development server.
- Review every page affected.
- Test on:
  - Desktop (1440px)
  - Tablet (820px)
  - Mobile (390px)

Compare the page before and after your changes.

---

## Layout Quality Checklist

Check for:

- Excessive whitespace
- Inconsistent spacing
- Uneven card heights
- Button alignment and consistency
- Image cropping
- Visual hierarchy
- Responsive behaviour
- Sticky navigation behaviour
- CLS/layout shift
- Overflow or horizontal scrolling
- Accessibility issues caused by layout changes

If something looks visually unbalanced, refine it before completing the task.

---

## Media Standards

Whenever implementing images or video:

- Optimise assets for web.
- Use descriptive SEO-friendly alt text.
- Add explicit width and height attributes.
- Lazy-load below-the-fold media.
- Preload hero media.
- Verify all media paths resolve.
- Remove placeholder assets.

---

## Browser QA

Before completing any task:

- Launch the local site.
- Check browser console for errors.
- Ensure no broken images.
- Ensure no placeholder content remains.
- Verify animations and interactions work correctly.
- Confirm Core Web Vitals have not been negatively affected.

---

## Git Standards

Before committing:

- Stage only intended files.
- Exclude backups and temporary files.
- Write a clear commit message.
- Provide a summary of all changes.
- Provide the commit hash.

---

## Expected Output

After every completed task, provide:

- Summary of changes.
- Files modified.
- QA completed.
- Any issues found.
- Commit hash.