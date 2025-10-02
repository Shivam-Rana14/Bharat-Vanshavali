"use client"

import { motion } from "framer-motion"
import { TreePine, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import Link from "next/link"

interface FooterLink {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

export function Footer() {
  const footerSections: FooterSection[] = [
    {
      title: "Platform",
      links: [
        { name: "Features", href: "#features" },
        { name: "Mission", href: "#mission" },
        { name: "Register", href: "/register" },
        { name: "Login", href: "/login" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Contact Us", href: "/contact" }
      ]
    },
    {
      title: "Contact",
      links: [
        { name: "support@bharatvanshavali.org", href: "mailto:support@bharatvanshavali.org", icon: Mail },
        { name: "+91 1800-123-4567", href: "tel:+911800123456", icon: Phone },
        { name: "New Delhi, India", href: "#", icon: MapPin }
      ]
    }
  ]

  return (
    <footer className="bg-gray-900 text-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="lg:col-span-2">
            <motion.div
              className="flex items-center space-x-3 mb-4 md:mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <TreePine className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="font-bold text-lg md:text-xl">भारत वंशावली</span>
            </motion.div>
            <p className="text-gray-400 leading-relaxed text-sm md:text-base mb-4">
              India's first open genealogy platform for preserving heritage and building community.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>
          
          {footerSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold text-base md:text-lg mb-4 md:mb-6">{section.title}</h3>
              <ul className="space-y-2 md:space-y-3">
                {section.links.map((link, idx) => (
                  <motion.li
                    key={idx}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors duration-300 text-xs md:text-sm flex items-center space-x-2"
                    >
                      {link.icon && <link.icon className="w-4 h-4" />}
                      <span>{link.name}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="border-t border-gray-800 pt-6 md:pt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-400 text-xs md:text-sm">
            &copy; 2024 Bharat Vanshavali Collective. All rights reserved. Made with ❤️ for India.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
