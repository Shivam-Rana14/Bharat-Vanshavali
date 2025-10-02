"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, TreePine, Users, Star } from 'lucide-react'

const steps = [
  {
    step: "1",
    icon: UserPlus,
    title: "Create Your Account",
    desc: "Sign up with your basic information and start your genealogical journey"
  },
  {
    step: "2", 
    icon: TreePine,
    title: "Build Your Family Tree",
    desc: "Add family members and create connections to build your family tree"
  },
  {
    step: "3",
    icon: Users,
    title: "Invite Family Members",
    desc: "Invite relatives to contribute and expand your family history together"
  },
  {
    step: "4",
    icon: Star,
    title: "Preserve Your Legacy",
    desc: "Document stories, traditions, and memories for future generations"
  }
]

export function HowItWorksSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  }

  const cardHoverVariants = {
    hover: {
      y: -10,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started with Bharat Vanshavali in just four simple steps
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {steps.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={cardHoverVariants.hover}
              className="group sm:col-span-2 lg:col-span-1 last:sm:col-start-1 last:sm:col-end-3 last:lg:col-start-auto last:lg:col-end-auto"
            >
              <Card className="text-center hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-lg h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <motion.div 
                    className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-2xl mx-auto mb-3 md:mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    {item.step}
                  </motion.div>
                  <div className="text-2xl md:text-4xl mb-3 md:mb-4">
                    <item.icon className="w-8 h-8 md:w-12 md:h-12 mx-auto" />
                  </div>
                  <CardTitle className="text-lg md:text-xl font-bold group-hover:text-orange-600 transition-colors duration-300">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 