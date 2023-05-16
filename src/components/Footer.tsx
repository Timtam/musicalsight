import { Link } from "react-router-dom"

function Footer() {
    return (
        <footer>
            <p>Copyright &copy; 2021 - {new Date().getFullYear()} Toni Barth</p>
            <Link to="/privacy-policy">Privacy Policy</Link>
        </footer>
    )
}

export default Footer
