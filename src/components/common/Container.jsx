// Max 1320px with the 16 / 24 / 40px gutter from --gutter (roadmap §3.3).
function Container({ children, className = "", as: Component = "div", ...props }) {
  return (
    <Component className={`mx-auto w-full max-w-container px-gutter ${className}`} {...props}>
      {children}
    </Component>
  );
}

export default Container;
