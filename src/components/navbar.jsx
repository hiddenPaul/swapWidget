import styles from "../styles/Navbar.module.css";
import { AppBar, Box, Container, Toolbar, Typography, Button, Link, alpha } from "@mui/material";
import Image from 'next/image'
import fls_logo from '../public/fls_logo.png'
import Menu from '@mui/material/Menu';
import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';



const pages = [
    { text: 'Home', href: '/' 
    },
    {
        href: "/purchase",
        text: "Purchase FLS",
    }
]

const myLoader = ({ src }) => {
    return src
}

function HamburgerMenu() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <Button
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                <MenuIcon sx={{ color: '#11E2F2' }} />
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                {pages.map((page, idx) => (
                    <MenuItem onClick={handleClose} key={idx} >
                        <Button href={page.href} target={page.href.startsWith('/') ? null : "_blank"} sx={{color: "#32667D"}}>
                            {page.text}
                        </Button>
                    </MenuItem>
                ))}
            </Menu>
        </div >
    );
}

export default function Navbar() {
    return (
        <AppBar position="static" color="primary" sx={{bgcolor: alpha("#002A3C",0.9)}}>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <div className={styles.logo} >
                        <Link href='/'>
                            <Image src={fls_logo} alt="Flawless" width={"50%"} height={"50%"} loader={myLoader} />
                        </Link>
                    </div>
                    <Typography
                        className={styles.navbarTitle}
                        component="a"
                        sx={{
                            mr: 2,
                            display: { md: "flex" },
                            fontWeight: 700,
                            color: "inherit",
                            textDecoration: "none",
                            fontFamily: "Orbitron",
                            letterSpacing: "0.2em",
                            flexGrow: 1,
                        }}
                    >
                        FlawlessToken
                    </Typography>
                    <HamburgerMenu sx={{ justifyContent: 'right' }} />
                </Toolbar>
            </Container>
        </AppBar>
    );
}
