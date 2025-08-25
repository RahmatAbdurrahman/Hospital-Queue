"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  BedIcon,
  Users,
  Moon,
  Sun,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Wrench,
  Calendar,
  UserX,
  Settings,
  Plus,
  UserPlus,
  Trash2,
  ArrowUpDown,
  Star,
  Calculator,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Types
interface Bed {
  id: string
  number: string
  status: "available" | "occupied" | "maintenance"
  patientName?: string
  ward: string
  admissionDate?: string
  expectedDischarge?: string
}

interface Patient {
  id: string
  name: string
  age: number
  severity: number // 1-5 scale
  waitingTime: number // in hours
  condition: string
  priority?: number
  ahpScore?: number
}

const HospitalSPK = () => {
  const [isDark, setIsDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [beds, setBeds] = useState<Bed[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [showBedModal, setShowBedModal] = useState(false)
  const [showPlacementModal, setShowPlacementModal] = useState(false)
  const [selectedPatientForPlacement, setSelectedPatientForPlacement] = useState<Patient | null>(null)
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    severity: "",
    condition: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isPrioritySorted, setIsPrioritySorted] = useState(false)

  const openPlacementModal = (patient: Patient) => {
    setSelectedPatientForPlacement(patient)
    setShowPlacementModal(true)
  }

  const placePatientInBed = (bedId: string) => {
    if (!selectedPatientForPlacement) return

    // Update bed status to occupied with patient info
    setBeds((prevBeds) =>
      prevBeds.map((bed) =>
        bed.id === bedId
          ? {
              ...bed,
              status: "occupied" as const,
              patientName: selectedPatientForPlacement.name,
              admissionDate: new Date().toISOString().split("T")[0],
              expectedDischarge: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            }
          : bed,
      ),
    )

    // Remove patient from queue
    setPatients((prevPatients) => prevPatients.filter((p) => p.id !== selectedPatientForPlacement.id))

    // Close modal and reset state
    setShowPlacementModal(false)
    setSelectedPatientForPlacement(null)

    // Reset priority sorting if active
    if (isPrioritySorted) {
      setIsPrioritySorted(false)
    }
  }

  const useCountUp = (end: number, duration = 2000) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
      let startTime: number
      let animationFrame: number

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        setCount(Math.floor(progress * end))

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      }

      animationFrame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationFrame)
    }, [end, duration])

    return count
  }

  const [animatedStats, setAnimatedStats] = useState({
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    maintenanceBeds: 0,
    bor: 0,
    waitingPatients: 0,
    criticalPatients: 0,
    averageWaitTime: 0,
  })

  const calculateAHPSAW = () => {
    if (patients.length === 0) return

    // Weights based on requirements: Severity 60%, Waiting Time 40%
    const weights = {
      severity: 0.6,
      waitingTime: 0.4,
    }

    // Find max values for normalization
    const maxSeverity = Math.max(...patients.map((p) => p.severity))
    const maxWaitingTime = Math.max(...patients.map((p) => p.waitingTime))

    // Calculate AHP-SAW scores for each patient
    const patientsWithScores = patients.map((patient) => {
      // Normalize criteria (higher is better for both severity and waiting time)
      const normalizedSeverity = patient.severity / maxSeverity
      const normalizedWaitingTime = patient.waitingTime / maxWaitingTime

      // Calculate weighted score
      const ahpScore = normalizedSeverity * weights.severity + normalizedWaitingTime * weights.waitingTime

      return {
        ...patient,
        ahpScore: Math.round(ahpScore * 100) / 100, // Round to 2 decimal places
      }
    })

    // Sort by AHP score (descending - highest priority first)
    const sortedPatients = patientsWithScores.sort((a, b) => (b.ahpScore || 0) - (a.ahpScore || 0))

    // Assign priority ranks
    const rankedPatients = sortedPatients.map((patient, index) => ({
      ...patient,
      priority: index + 1,
    }))

    setPatients(rankedPatients)
    setIsPrioritySorted(true)
  }

  const resetPriority = () => {
    const resetPatients = patients.map((patient) => ({
      ...patient,
      priority: undefined,
      ahpScore: undefined,
    }))
    setPatients(resetPatients)
    setIsPrioritySorted(false)
  }

  const useCountUpHook = useCountUp

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem("hospital-theme")
    if (savedTheme === "dark") {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }

    const initialBeds: Bed[] = Array.from({ length: 20 }, (_, i) => {
      const isOccupied = Math.random() > 0.6
      const isMaintenance = !isOccupied && Math.random() > 0.8
      return {
        id: `bed-${i + 1}`,
        number: `${Math.floor(i / 5) + 1}${String.fromCharCode(65 + (i % 5))}`,
        status: isOccupied ? "occupied" : isMaintenance ? "maintenance" : "available",
        patientName: isOccupied ? `Patient ${i + 1}` : undefined,
        ward: `Ward ${Math.floor(i / 5) + 1}`,
        admissionDate: isOccupied
          ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : undefined,
        expectedDischarge: isOccupied
          ? new Date(Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : undefined,
      }
    })

    const initialPatients: Patient[] = [
      { id: "1", name: "Ahmad Rizki", age: 45, severity: 4, waitingTime: 3, condition: "Chest Pain" },
      { id: "2", name: "Siti Nurhaliza", age: 32, severity: 2, waitingTime: 1, condition: "Fever" },
      { id: "3", name: "Budi Santoso", age: 67, severity: 5, waitingTime: 2, condition: "Heart Attack" },
      { id: "4", name: "Maya Sari", age: 28, severity: 3, waitingTime: 4, condition: "Fracture" },
    ]

    setBeds(initialBeds)
    setPatients(initialPatients)

    const stats = {
      totalBeds: initialBeds.length,
      availableBeds: initialBeds.filter((bed) => bed.status === "available").length,
      occupiedBeds: initialBeds.filter((bed) => bed.status === "occupied").length,
      maintenanceBeds: initialBeds.filter((bed) => bed.status === "maintenance").length,
      bor:
        initialBeds.length > 0
          ? Math.round((initialBeds.filter((bed) => bed.status === "occupied").length / initialBeds.length) * 100)
          : 0,
      waitingPatients: initialPatients.length,
      criticalPatients: initialPatients.filter((p) => p.severity >= 4).length,
      averageWaitTime:
        initialPatients.length > 0
          ? Math.round(initialPatients.reduce((sum, p) => sum + p.waitingTime, 0) / initialPatients.length)
          : 0,
    }

    setAnimatedStats(stats)
  }, [])

  useEffect(() => {
    const stats = {
      totalBeds: beds.length,
      availableBeds: beds.filter((bed) => bed.status === "available").length,
      occupiedBeds: beds.filter((bed) => bed.status === "occupied").length,
      maintenanceBeds: beds.filter((bed) => bed.status === "maintenance").length,
      bor:
        beds.length > 0 ? Math.round((beds.filter((bed) => bed.status === "occupied").length / beds.length) * 100) : 0,
      waitingPatients: patients.length,
      criticalPatients: patients.filter((p) => p.severity >= 4).length,
      averageWaitTime:
        patients.length > 0 ? Math.round(patients.reduce((sum, p) => sum + p.waitingTime, 0) / patients.length) : 0,
    }
    setAnimatedStats(stats)
  }, [beds, patients])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!newPatient.name.trim()) errors.name = "Name is required"
    if (!newPatient.age || Number.parseInt(newPatient.age) < 1 || Number.parseInt(newPatient.age) > 120) {
      errors.age = "Valid age is required (1-120)"
    }
    if (!newPatient.severity || Number.parseInt(newPatient.severity) < 1 || Number.parseInt(newPatient.severity) > 5) {
      errors.severity = "Severity level is required (1-5)"
    }
    if (!newPatient.condition.trim()) errors.condition = "Condition is required"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const addPatient = () => {
    if (!validateForm()) return

    const patient: Patient = {
      id: Date.now().toString(),
      name: newPatient.name.trim(),
      age: Number.parseInt(newPatient.age),
      severity: Number.parseInt(newPatient.severity),
      condition: newPatient.condition.trim(),
      waitingTime: 0,
    }

    setPatients((prev) => [...prev, patient])
    setNewPatient({ name: "", age: "", severity: "", condition: "" })
    setFormErrors({})
    setShowAddPatient(false)

    // Reset priority sorting when new patient is added
    if (isPrioritySorted) {
      setIsPrioritySorted(false)
    }
  }

  const removePatient = (patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId))
  }

  const getSeverityBadge = (severity: number) => {
    if (severity >= 5) return { color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100", label: "Critical" }
    if (severity >= 4)
      return { color: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100", label: "High" }
    if (severity >= 3)
      return { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100", label: "Medium" }
    if (severity >= 2) return { color: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100", label: "Low" }
    return { color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100", label: "Minimal" }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((patient) => ({
          ...patient,
          waitingTime: patient.waitingTime + 1 / 60, // Add 1 minute
        })),
      )
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    if (newTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("hospital-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("hospital-theme", "light")
    }
  }

  const updateBedStatus = (bedId: string, newStatus: Bed["status"], patientName?: string) => {
    setBeds((prevBeds) =>
      prevBeds.map((bed) =>
        bed.id === bedId
          ? {
              ...bed,
              status: newStatus,
              patientName: newStatus === "occupied" ? patientName : undefined,
              admissionDate: newStatus === "occupied" ? new Date().toISOString().split("T")[0] : undefined,
              expectedDischarge:
                newStatus === "occupied"
                  ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                  : undefined,
            }
          : bed,
      ),
    )
    setShowBedModal(false)
    setSelectedBed(null)
  }

  const getBedStatusStyle = (status: Bed["status"]) => {
    switch (status) {
      case "available":
        return {
          bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
          text: "text-green-700 dark:text-green-300",
          badge: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
        }
      case "occupied":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
          text: "text-blue-700 dark:text-blue-300",
          badge: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
        }
      case "maintenance":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-700 dark:text-yellow-300",
          badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
        }
    }
  }

  const wardStats = beds.reduce(
    (acc, bed) => {
      if (!acc[bed.ward]) {
        acc[bed.ward] = { total: 0, occupied: 0, available: 0, maintenance: 0 }
      }
      acc[bed.ward].total++
      acc[bed.ward][bed.status]++
      return acc
    },
    {} as Record<string, { total: number; occupied: number; available: number; maintenance: number }>,
  )

  const availableBeds = beds.filter((bed) => bed.status === "available")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.div
        className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <motion.h1
                className="text-xl font-bold text-sidebar-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                HospitalQ
              </motion.h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
              <Activity className="h-4 w-4 mr-2" />
              {sidebarOpen && "Dashboard"}
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
              <BedIcon className="h-4 w-4 mr-2" />
              {sidebarOpen && "Bed Management"}
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
              <Users className="h-4 w-4 mr-2" />
              {sidebarOpen && "Patient Queue"}
            </Button>
          </nav>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {sidebarOpen && (isDark ? "Light Mode" : "Dark Mode")}
          </Button>
        </div>
      </motion.div>

      <div className={`${sidebarOpen ? "ml-64" : "ml-16"} transition-all duration-300`}>
        <div className="p-6">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Hospital Bed Management</h1>
            <p className="text-muted-foreground">Decision Support System for Optimal Bed Allocation</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {[
              {
                title: "Total Beds",
                value: animatedStats.totalBeds,
                icon: BedIcon,
                color: "text-primary",
                bgColor: "bg-primary/10",
                trend: "+2 this week",
              },
              {
                title: "Available",
                value: animatedStats.availableBeds,
                icon: CheckCircle,
                color: "text-green-600",
                bgColor: "bg-green-100 dark:bg-green-900/20",
                trend: `${Math.round((animatedStats.availableBeds / animatedStats.totalBeds) * 100)}% capacity`,
              },
              {
                title: "Occupied",
                value: animatedStats.occupiedBeds,
                icon: Users,
                color: "text-blue-600",
                bgColor: "bg-blue-100 dark:bg-blue-900/20",
                trend: `${animatedStats.bor}% BOR`,
              },
              {
                title: "Waiting Queue",
                value: animatedStats.waitingPatients,
                icon: Clock,
                color: "text-orange-600",
                bgColor: "bg-orange-100 dark:bg-orange-900/20",
                trend: `${animatedStats.averageWaitTime}h avg wait`,
              },
            ].map((stat, index) => {
              const animatedValue = useCountUpHook(stat.value, 1500 + index * 200)

              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                          {React.createElement(stat.icon, { className: `h-6 w-6 ${stat.color}` })}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stat.trend}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                        <motion.p
                          className="text-3xl font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                        >
                          {animatedValue}
                        </motion.p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Critical Patients</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                      {animatedStats.criticalPatients}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">Severity Level 4-5</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Maintenance</p>
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                      {animatedStats.maintenanceBeds}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Beds Under Repair</p>
                  </div>
                  <Wrench className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Efficiency</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {Math.max(0, 100 - animatedStats.bor)}%
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Optimization Score</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Ward Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(wardStats).map(([ward, data], index) => (
                    <motion.div
                      key={ward}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <h4 className="font-semibold mb-3">{ward}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Occupancy</span>
                          <span className="font-medium">
                            {data.occupied}/{data.total}
                          </span>
                        </div>
                        <Progress value={(data.occupied / data.total) * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Available: {data.available}</span>
                          <span>Maintenance: {data.maintenance}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BedIcon className="h-5 w-5" />
                    Interactive Bed Grid
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {beds.map((bed, index) => {
                    const statusStyle = getBedStatusStyle(bed.status)
                    return (
                      <motion.div
                        key={bed.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 1.6 + index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedBed(bed)
                          setShowBedModal(true)
                        }}
                      >
                        <Card className={`${statusStyle.bg} border-2 hover:shadow-lg transition-all duration-300`}>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-2">
                                <BedIcon className={`h-6 w-6 ${statusStyle.text}`} />
                              </div>
                              <h4 className={`font-bold text-lg ${statusStyle.text}`}>{bed.number}</h4>
                              <Badge className={`text-xs mt-2 ${statusStyle.badge}`}>
                                {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
                              </Badge>
                              {bed.patientName && (
                                <p className={`text-xs mt-1 ${statusStyle.text} truncate`}>{bed.patientName}</p>
                              )}
                              <p className={`text-xs ${statusStyle.text} opacity-75`}>{bed.ward}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.8 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Patient Queue ({patients.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {patients.length > 0 && (
                        <Button
                          onClick={isPrioritySorted ? resetPriority : calculateAHPSAW}
                          size="sm"
                          variant={isPrioritySorted ? "outline" : "default"}
                          className="flex items-center gap-2"
                        >
                          {isPrioritySorted ? (
                            <>
                              <X className="h-4 w-4" />
                              Reset Priority
                            </>
                          ) : (
                            <>
                              <ArrowUpDown className="h-4 w-4" />
                              Sort Priority
                            </>
                          )}
                        </Button>
                      )}
                      <Button onClick={() => setShowAddPatient(true)} size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Patient
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {patients.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No patients in queue</p>
                      <Button onClick={() => setShowAddPatient(true)} variant="outline" className="mt-4">
                        Add First Patient
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {patients.map((patient, index) => {
                          const severityBadge = getSeverityBadge(patient.severity)
                          const isTopPriority = isPrioritySorted && patient.priority === 1

                          return (
                            <motion.div
                              key={patient.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{
                                duration: 0.3,
                                delay: isPrioritySorted ? 0 : index * 0.1,
                                layout: { duration: 0.5 },
                              }}
                              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                                isTopPriority
                                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700 shadow-md"
                                  : "bg-card hover:shadow-md"
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {isPrioritySorted && patient.priority && (
                                    <div
                                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                        patient.priority === 1
                                          ? "bg-yellow-500 text-white"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {patient.priority}
                                    </div>
                                  )}
                                  <h4 className="font-semibold">{patient.name}</h4>
                                  <Badge className={severityBadge.color}>{severityBadge.label}</Badge>
                                  {isTopPriority && (
                                    <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      Top Priority
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                                  <span>Age: {patient.age}</span>
                                  <span>Condition: {patient.condition}</span>
                                  <span>Wait: {Math.round(patient.waitingTime)}h</span>
                                  {isPrioritySorted && patient.ahpScore && (
                                    <span className="font-medium text-primary">Score: {patient.ahpScore}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPlacementModal(patient)}
                                  disabled={availableBeds.length === 0}
                                  className="text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                                >
                                  <MapPin className="h-4 w-4 mr-1" />
                                  Place
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removePatient(patient.id)}
                                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Decision Support System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-semibold mb-2">AHP-SAW Algorithm</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Analytical Hierarchy Process - Simple Additive Weighting method for patient prioritization.
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Severity Level Weight:</span>
                          <span className="font-medium">60%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Waiting Time Weight:</span>
                          <span className="font-medium">40%</span>
                        </div>
                      </div>
                    </div>

                    {isPrioritySorted && patients.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-primary/10 border border-primary/20"
                      >
                        <h4 className="font-semibold mb-2 text-primary">Priority Ranking Results</h4>
                        <div className="space-y-2">
                          {patients.slice(0, 3).map((patient, index) => (
                            <div key={patient.id} className="flex justify-between text-sm">
                              <span>
                                #{index + 1} {patient.name}
                              </span>
                              <span className="font-medium">Score: {patient.ahpScore}</span>
                            </div>
                          ))}
                        </div>
                        {patients.length > 3 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            +{patients.length - 3} more patients ranked
                          </p>
                        )}
                      </motion.div>
                    )}

                    {!isPrioritySorted && patients.length > 0 && (
                      <div className="text-center py-4">
                        <Button onClick={calculateAHPSAW} className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          Calculate Priority Ranking
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Use AHP-SAW algorithm to rank patients by priority
                        </p>
                      </div>
                    )}

                    {patients.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Add patients to use decision support</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBedModal && selectedBed && (
          <Dialog open={showBedModal} onOpenChange={setShowBedModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BedIcon className="h-5 w-5" />
                  Bed {selectedBed.number} Details
                </DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Ward</Label>
                    <p className="text-sm text-muted-foreground">{selectedBed.ward}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getBedStatusStyle(selectedBed.status).badge}>
                      {selectedBed.status.charAt(0).toUpperCase() + selectedBed.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {selectedBed.status === "occupied" && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Patient</Label>
                      <p className="text-sm text-muted-foreground">{selectedBed.patientName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Admission Date</Label>
                        <p className="text-sm text-muted-foreground">{selectedBed.admissionDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Expected Discharge</Label>
                        <p className="text-sm text-muted-foreground">{selectedBed.expectedDischarge}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Update Status</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedBed.status === "available" ? "default" : "outline"}
                      onClick={() => updateBedStatus(selectedBed.id, "available")}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Available
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedBed.status === "maintenance" ? "default" : "outline"}
                      onClick={() => updateBedStatus(selectedBed.id, "maintenance")}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Maintenance
                    </Button>
                  </div>
                  {selectedBed.status === "occupied" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBedStatus(selectedBed.id, "available")}
                      className="w-full"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Discharge Patient
                    </Button>
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddPatient && (
          <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New Patient
                </DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Patient Name</Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter patient name"
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, age: e.target.value }))}
                      placeholder="Age"
                      min="1"
                      max="120"
                      className={formErrors.age ? "border-destructive" : ""}
                    />
                    {formErrors.age && <p className="text-sm text-destructive">{formErrors.age}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity Level</Label>
                    <Select
                      value={newPatient.severity}
                      onValueChange={(value) => setNewPatient((prev) => ({ ...prev, severity: value }))}
                    >
                      <SelectTrigger className={formErrors.severity ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Minimal</SelectItem>
                        <SelectItem value="2">2 - Low</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - High</SelectItem>
                        <SelectItem value="5">5 - Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.severity && <p className="text-sm text-destructive">{formErrors.severity}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Medical Condition</Label>
                  <Input
                    id="condition"
                    value={newPatient.condition}
                    onChange={(e) => setNewPatient((prev) => ({ ...prev, condition: e.target.value }))}
                    placeholder="Enter medical condition"
                    className={formErrors.condition ? "border-destructive" : ""}
                  />
                  {formErrors.condition && <p className="text-sm text-destructive">{formErrors.condition}</p>}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={addPatient} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddPatient(false)
                      setNewPatient({ name: "", age: "", severity: "", condition: "" })
                      setFormErrors({})
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlacementModal && selectedPatientForPlacement && (
          <Dialog open={showPlacementModal} onOpenChange={setShowPlacementModal}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Place Patient: {selectedPatientForPlacement.name}
                </DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Age:</span> {selectedPatientForPlacement.age}
                    </div>
                    <div>
                      <span className="font-medium">Condition:</span> {selectedPatientForPlacement.condition}
                    </div>
                    <div>
                      <span className="font-medium">Severity:</span>
                      <Badge className={`ml-2 ${getSeverityBadge(selectedPatientForPlacement.severity).color}`}>
                        {getSeverityBadge(selectedPatientForPlacement.severity).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {availableBeds.length === 0 ? (
                  <div className="text-center py-8">
                    <BedIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No available beds at the moment</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please wait for a bed to become available or discharge a patient
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Available Beds ({availableBeds.length})</h4>
                      <p className="text-sm text-muted-foreground">Click a bed to place the patient</p>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                      {availableBeds.map((bed, index) => {
                        const statusStyle = getBedStatusStyle(bed.status)
                        return (
                          <motion.div
                            key={bed.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="cursor-pointer"
                            onClick={() => placePatientInBed(bed.id)}
                          >
                            <Card
                              className={`${statusStyle.bg} border-2 hover:shadow-lg transition-all duration-300 hover:border-primary`}
                            >
                              <CardContent className="p-3">
                                <div className="text-center">
                                  <div className="flex items-center justify-center mb-2">
                                    <BedIcon className={`h-5 w-5 ${statusStyle.text}`} />
                                  </div>
                                  <h4 className={`font-bold ${statusStyle.text}`}>{bed.number}</h4>
                                  <p className={`text-xs ${statusStyle.text} opacity-75 mt-1`}>{bed.ward}</p>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowPlacementModal(false)
                      setSelectedPatientForPlacement(null)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HospitalSPK
