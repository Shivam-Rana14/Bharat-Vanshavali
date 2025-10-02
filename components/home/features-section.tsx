"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TreePine, Users, Shield, MapPin, Heart, FileText, Globe, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: TreePine,
    title: "Family Tree Builder",
    description: "Create and visualize your family tree with our intuitive drag-and-drop interface",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Users,
    title: "Collaborative Platform",
    description: "Invite family members to contribute and build your family history together",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your family data is protected with enterprise-grade security and privacy controls",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: MapPin,
    title: "Geographic Mapping",
    description: "Track your family's journey across India and the world with interactive maps",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Heart,
    title: "Cultural Preservation",
    description: "Preserve traditions, stories, and cultural heritage for future generations",
    color: "from-red-500 to-pink-500"
  },
  {
    icon: FileText,
    title: "Document Storage",
    description: "Safely store and organize family documents, photos, and historical records",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: Globe,
    title: "Global Connections",
    description: "Connect with extended family members across the globe",
    color: "from-teal-500 to-green-500"
  },
  {
    icon: CheckCircle,
    title: "Verified Records",
    description: "Access verified genealogical records and historical databases",
    color: "from-yellow-500 to-orange-500"
  }
]

export function FeaturesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
    <section className="py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Build Your Family Legacy
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools and features you need to preserve, 
            connect, and celebrate your family's rich history and heritage.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={cardHoverVariants.hover}
              className="group"
            >
              <Card className="text-center hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-lg h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-green-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <motion.div 
                    className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center text-white font-bold text-lg md:text-2xl mx-auto mb-3 md:mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-6 h-6 md:w-8 md:h-8" />
                  </motion.div>
                  <CardTitle className="text-lg md:text-xl font-bold group-hover:text-orange-600 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 