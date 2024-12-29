package main

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tealeg/xlsx"
)

type Config struct {
	SecretKey     string
	FilePathUser  string
	FilePathBerita string
	FilePathSaved string
}

var CONFIG = Config{
	SecretKey:      "ReplaceWithSecureKey",
	FilePathUser:   "./data.xlsx",
	FilePathBerita: "./berita.xlsx",
	FilePathSaved:  "./saved.xlsx",
}

type RowData struct {
	Nama          string  `json:"Nama"`
	JumlahBayarKas float64 `json:"jumlah_bayar_kas"`
	Status        string  `json:"status"`
}

func main() {
	r := gin.Default()

	// Middleware
	r.Use(securityHeaders())
	r.Use(inputSanitizer())

	// Routes
	r.GET("/data", fetchUserData)
	r.GET("/berita", fetchNewsData)
	r.GET("/dashboard", fetchDashboardData)
	r.POST("/checkin", handleCheckIn)
	r.POST("/approve", handleApprove)

	// Start server
	if err := r.Run("localhost:5000"); err != nil {
		fmt.Println("Failed to start server:", err)
	}
}

// Middleware for security headers (Helmet equivalent)
func securityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		c.Next()
	}
}

// Middleware for input sanitization
func inputSanitizer() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodPost || c.Request.Method == http.MethodPut {
			var sanitized map[string]interface{}
			if err := c.ShouldBindJSON(&sanitized); err == nil {
				for key, value := range sanitized {
					if str, ok := value.(string); ok {
						sanitized[key] = sanitizeString(str)
					}
				}
				c.Set("sanitizedBody", sanitized)
			}
		}
		c.Next()
	}
}

func sanitizeString(input string) string {
	return strings.TrimSpace(strings.ReplaceAll(input, "\n", ""))
}

// Route handlers
func fetchUserData(c *gin.Context) {
	data, err := readXLSX(CONFIG.FilePathUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read user data file"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func fetchNewsData(c *gin.Context) {
	data, err := readXLSX(CONFIG.FilePathBerita)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read news data file"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func fetchDashboardData(c *gin.Context) {
	data, err := readXLSX(CONFIG.FilePathSaved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load dashboard data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func handleCheckIn(c *gin.Context) {
	body, exists := c.Get("sanitizedBody")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	data := body.(map[string]interface{})
	
	name, _ := data["name"].(string)
	kas, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["kas"]), 64)

	dashboardData, err := readXLSX(CONFIG.FilePathSaved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load data"})
		return
	}

	newRow := RowData{
		Nama:          name,
		JumlahBayarKas: kas,
		Status:        "Pending",
	}
	dashboardData = append(dashboardData, newRow)
	if err := saveXLSX(CONFIG.FilePathSaved, dashboardData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save check-in"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Check-in request sent!"})
}

func handleApprove(c *gin.Context) {
	body, exists := c.Get("sanitizedBody")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	data := body.(map[string]interface{})
	
	name, _ := data["name"].(string)
	approve, _ := data["approve"].(bool)

	dashboardData, err := readXLSX(CONFIG.FilePathSaved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load data"})
		return
	}

	updated := false
	for i, row := range dashboardData {
		if row.Nama == name {
			if approve {
				row.Status = "Approved"
				row.JumlahBayarKas++
			} else {
				row.Status = "Rejected"
			}
			dashboardData[i] = row
			updated = true
			break
		}
	}

	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := saveXLSX(CONFIG.FilePathUser, dashboardData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save approval"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("User %s", map[bool]string{true: "approved", false: "rejected"}[approve])})
}

// Utility functions
func readXLSX(filePath string) ([]RowData, error) {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return []RowData{}, nil
	}
	file, err := xlsx.OpenFile(filePath)
	if err != nil {
		return nil, err
	}
	
	var data []RowData
	for _, sheet := range file.Sheets {
		for _, row := range sheet.Rows {
			if len(row.Cells) >= 3 {
				Nama := row.Cells[A].String()
				Jumlah, _ := row.Cells[B].Float()
				Status := row.Cells[C].String()
				data = append(data, RowData{
					Nama:          Nama,
					JumlahBayarKas: Jumlah,
					Status:        Status,
				})
			}
		}
	}
	return data, nil
}

func saveXLSX(filePath string, data []RowData) error {
	file := xlsx.NewFile()
	sheet, err := file.AddSheet("Data")
	if err != nil {
		return err
	}
	for _, row := range data {
		newRow := sheet.AddRow()
		newRow.AddCell().SetString(row.Nama)
		newRow.AddCell().SetFloat(row.JumlahBayarKas)
		newRow.AddCell().SetString(row.Status)
	}
	return file.Save(filePath)
}
