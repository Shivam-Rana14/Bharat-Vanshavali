"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/components/providers/auth-provider"

export function CTASection() {
  const { user } = useAuth()

  return (
    <motion.section 
      className="py-16 md:py-20 lg:py-32 px-4 bg-gradient-to-r from-orange-500 via-red-500 to-green-600 text-white relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
    >
      <div className="absolute inset-0 bg-black/10"></div>
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(249,115,22,0.1) 0%, rgba(34,197,94,0.1) 100%)",
            "linear-gradient(45deg, rgba(34,197,94,0.1) 0%, rgba(249,115,22,0.1) 100%)",
            "linear-gradient(45deg, rgba(249,115,22,0.1) 0%, rgba(34,197,94,0.1) 100%)"
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="container mx-auto text-center relative z-10">
        <motion.h2 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Become Part of India's Largest Genealogy Movement
        </motion.h2>
        <motion.p 
          className="text-lg sm:text-xl lg:text-2xl mb-8 md:mb-12 opacity-90 max-w-3xl mx-auto px-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Where every family contributes, collaborates, and cares
        </motion.p>
        {!user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100 px-8 md:px-12 py-4 md:py-6 text-lg md:text-xl shadow-2xl hover:shadow-3xl transition-all duration-300">
                Start Your Journey Today
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
} 