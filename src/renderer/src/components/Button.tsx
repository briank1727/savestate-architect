import { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

function Button({ className, type = 'button', ...rest }: ButtonProps): React.JSX.Element {
  return <button type={type} className={`btn${className ? ` ${className}` : ''}`} {...rest} />
}

export default Button
