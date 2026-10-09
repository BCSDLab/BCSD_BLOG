/** Wrap the menu only when its content no longer fits beside the brand/actions. */
export function setupResponsiveHeader() {
  const header = document.querySelector<HTMLElement>('.header-inner');
  const brand = header?.querySelector<HTMLElement>('.brand');
  const nav = header?.querySelector<HTMLElement>('.main-nav');
  const actions = header?.querySelector<HTMLElement>('.header-actions');
  if (!header || !brand || !nav || !actions) return () => {};

  let frame = 0;
  let disposed = false;
  const px = (value: string) => Number.parseFloat(value) || 0;
  const update = () => {
    frame = 0;
    if (disposed) return;
    const headerStyle = getComputedStyle(header);
    const navStyle = getComputedStyle(nav);
    const links = Array.from(nav.children) as HTMLElement[];
    // Measure links rather than nav.scrollWidth: the nav stretches after wrapping.
    const menuWidth =
      links.reduce((total, link) => {
        const style = getComputedStyle(link);
        return (
          total +
          link.getBoundingClientRect().width +
          px(style.marginLeft) +
          px(style.marginRight)
        );
      }, 0) +
      Math.max(0, links.length - 1) * px(navStyle.columnGap);
    const available =
      header.clientWidth -
      px(headerStyle.paddingLeft) -
      px(headerStyle.paddingRight);
    const required =
      brand.getBoundingClientRect().width +
      menuWidth +
      actions.getBoundingClientRect().width +
      2 * px(headerStyle.columnGap);
    header.toggleAttribute('data-wrapped', required > available);
  };
  const schedule = () => {
    if (!disposed && !frame) frame = requestAnimationFrame(update);
  };
  const observer = new ResizeObserver(schedule);
  for (const element of [
    header,
    brand,
    nav,
    actions,
    ...Array.from(nav.children),
  ])
    observer.observe(element);
  document.fonts.addEventListener('loadingdone', schedule);
  void document.fonts.ready.then(schedule);
  update();
  return () => {
    disposed = true;
    observer.disconnect();
    cancelAnimationFrame(frame);
    document.fonts.removeEventListener('loadingdone', schedule);
  };
}
