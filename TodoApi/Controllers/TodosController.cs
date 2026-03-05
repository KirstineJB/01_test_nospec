using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodosController(TodoContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TodoItem>>> GetAll()
    {
        return await context.TodoItems.OrderByDescending(t => t.CreatedAt).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TodoItem>> GetById(int id)
    {
        var item = await context.TodoItems.FindAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TodoItem>> Create(CreateTodoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest("Title is required.");

        var item = new TodoItem
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim()
        };

        context.TodoItems.Add(item);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TodoItem>> Update(int id, UpdateTodoRequest request)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest("Title is required.");

        item.Title = request.Title.Trim();
        item.Description = request.Description?.Trim();

        await context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPatch("{id}/toggle")]
    public async Task<ActionResult<TodoItem>> Toggle(int id)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item is null) return NotFound();

        item.IsCompleted = !item.IsCompleted;
        item.CompletedAt = item.IsCompleted ? DateTime.UtcNow : null;

        await context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await context.TodoItems.FindAsync(id);
        if (item is null) return NotFound();

        context.TodoItems.Remove(item);
        await context.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateTodoRequest(string Title, string? Description);
public record UpdateTodoRequest(string Title, string? Description);
