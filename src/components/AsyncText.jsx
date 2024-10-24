import { useEffect, useState } from 'react';

function AsyncText({ children }) {
  if (typeof children === 'string') return children;
  const [text, setText] = useState('');
  useEffect(() => {
    Promise.resolve(children).then(setText);
  }, [children]);
  return text;
}

export default AsyncText;
